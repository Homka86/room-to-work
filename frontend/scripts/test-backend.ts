import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { book, cancel, snapshot, startSession, currentUser, ApiError } from '../server/campus-service';

// Exercise the production statements on real SQLite, including transaction rollback.
function adapter(sqlite: DatabaseSync): D1Database {
  return {
    prepare(sql: string) {
      const statement = { sql, values: [] as unknown[],
        bind(...values: unknown[]) { this.values = values; return this; },
        async first() { return sqlite.prepare(sql).get(...this.values as SQLInputValue[]) ?? null; } };
      return statement;
    },
    async batch(statements: {sql: string; values: SQLInputValue[]}[]) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map(s => ({ success: true, results: sqlite.prepare(s.sql).all(...s.values) }));
        sqlite.exec('COMMIT'); return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  } as unknown as D1Database;
}
const NOW = Date.parse('2026-09-07T07:00:00+05:00');
function fixture() {
  const dir = mkdtempSync(join(tmpdir(),'campus-test-'));
  const file = join(dir,'campus.sqlite');
  const sqlite = new DatabaseSync(file);
  sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;');
  for (const f of readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort()) sqlite.exec(readFileSync(join('drizzle',f),'utf8'));
  const alice = { id: 'alice', role: 'student' as const, university_id: null };
  const bob = { id: 'bob', role: 'student' as const, university_id: null };
  const charlie = { id: 'charlie', role: 'student' as const, university_id: null };
  const dave = { id: 'dave', role: 'student' as const, university_id: null };
  sqlite.prepare('INSERT INTO users (id,created_at) VALUES (?,?)').run(alice.id,NOW);
  sqlite.prepare('INSERT INTO users (id,created_at) VALUES (?,?)').run(bob.id,NOW);
  sqlite.prepare('INSERT INTO users (id,created_at) VALUES (?,?)').run(charlie.id,NOW);
  sqlite.prepare('INSERT INTO users (id,created_at) VALUES (?,?)').run(dave.id,NOW);
  return { sqlite, db: adapter(sqlite), alice, bob, charlie, dave, file, dir, dispose() { try { sqlite.close(); } catch {} rmSync(dir,{recursive:true,force:true}); } };
}
function input(extra = {}) { return { id: crypto.randomUUID(), roomId: 1, date: '2026-09-07', startTime: 480, endTime: 510, attendees: 4, userName: 'Участник', purpose: 'Проект', ...extra }; }
const conflict = (e: unknown) => e instanceof ApiError && e.status === 409;

void test('shared schedule, ownership, adjacent reservations and idempotent writes', async () => {
  const f = fixture();
  try {
    const data = input({roomId:4});
    const a = await book(f.db,f.alice,data,NOW);
    assert.equal((await book(f.db,f.alice,data,NOW)).id,a.id);
    await book(f.db,f.bob,input({roomId:4}),NOW);
    await book(f.db,f.charlie,input({roomId:4}),NOW);
    await assert.rejects(book(f.db,f.dave,input({ roomId:4, attendees: 4 }),NOW),conflict);
    await assert.rejects(book(f.db,f.alice,input({roomId:4}),NOW),conflict);
    await book(f.db,f.alice,input({roomId:4,startTime:510,endTime:540}),NOW);
    const publicState = await snapshot(f.db,null,NOW);
    assert.equal(publicState.schedules.length,4);
    assert.equal(publicState.schedules.filter(slot => slot.attendees === 4).length,4);
    assert.equal(publicState.bookings.length,0);
    assert.equal(JSON.stringify(publicState.schedules).includes('Участник'),false);
    await assert.rejects(cancel(f.db,f.bob,a.id,NOW),e => e instanceof ApiError && e.status === 404);
    await assert.rejects(book(f.db,f.alice,{...data,purpose:'Other'},NOW),conflict);
  } finally { f.dispose(); }
});
void test('concurrent requests cannot reserve one room twice', async () => {
  const f = fixture();
  try {
    const results = await Promise.allSettled([book(f.db,f.alice,input({ attendees: 6 }),NOW),book(f.db,f.bob,input({ attendees: 6 }),NOW)]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    assert.equal((await snapshot(f.db,null,NOW)).schedules.length,1);
  } finally { f.dispose(); }
});
void test('server validates dates, hours, duration and capacity', async () => {
  const f = fixture();
  try {
    for (const bad of [{date:'2026-02-30'},{date:'2026-09-06'},{date:'2026-09-14'},{startTime:470},{endTime:495},{endTime:750},{endTime:1350},{attendees:7},{attendees:3},{attendees:0},{attendees:1.5},{userName:''},{purpose:'x'.repeat(501)}]) {
      await assert.rejects(book(f.db,f.alice,input(bad),NOW),e => e instanceof ApiError && e.status===400);
    }
  } finally { f.dispose(); }
});
void test('early cancellation does not spend allowance; late cancellation costs exactly once', async () => {
  const f = fixture();
  try {
    const early = await book(f.db,f.alice,input({startTime:570,endTime:600}),NOW);
    assert.equal((await cancel(f.db,f.alice,early.id,NOW)).outcome,'early');
    const first = await book(f.db,f.alice,input(),NOW);
    assert.equal((await cancel(f.db,f.alice,first.id,NOW)).outcome,'free_monthly');
    const second = await book(f.db,f.alice,input(),NOW);
    await Promise.all([cancel(f.db,f.alice,second.id,NOW),cancel(f.db,f.alice,second.id,NOW)]);
    const state = await snapshot(f.db,f.alice,NOW);
    assert.equal(state.profile.rating,-2);
    assert.equal(state.profile.freeCancellationsUsed,1);
    assert.equal(state.schedules.length,0);
    assert.deepEqual(state.restrictedRoomIds,[1]);
    await assert.rejects(book(f.db,f.alice,input(),NOW),conflict);
    await book(f.db,f.alice,input({roomId:2}),NOW);
  } finally { f.dispose(); }
});
void test('parallel late cancellations share one monthly allowance; exactly two hours is late', async () => {
  const f = fixture();
  try {
    const a = await book(f.db,f.alice,input(),NOW);
    const b = await book(f.db,f.alice,input({startTime:540,endTime:570}),NOW);
    await Promise.all([cancel(f.db,f.alice,a.id,NOW),cancel(f.db,f.alice,b.id,NOW)]);
    const state = await snapshot(f.db,f.alice,NOW);
    assert.equal(state.profile.rating,-2);
    assert.equal(state.profile.freeCancellationsUsed,1);
  } finally { f.dispose(); }
});
void test('completion reward once, monthly reset, popularity expires and teacher exemption', async () => {
  const f = fixture();
  try {
    await book(f.db,f.alice,input(),NOW);
    const later = NOW + 2 * 3600000;
    assert.equal((await snapshot(f.db,f.alice,later)).profile.rating,1);
    assert.equal((await snapshot(f.db,f.alice,later)).profile.rating,1);
    // Selecting another date on the client has no effect on the server clock.
    const b = await book(f.db,f.alice,input({roomId:2,startTime:600,endTime:630}),later);
    await cancel(f.db,f.alice,b.id,later);
    const c = await book(f.db,f.alice,input({roomId:2,startTime:600,endTime:630}),later);
    await cancel(f.db,f.alice,c.id,later);
    assert.equal((await snapshot(f.db,f.alice,later)).profile.rating,-1);
    const nextMonth = Date.parse('2026-10-08T07:00:00+05:00');
    const state = await snapshot(f.db,f.alice,nextMonth);
    assert.equal(state.profile.freeCancellationsUsed,0);
    assert.equal(state.restrictedRoomIds.length,0);
    f.sqlite.prepare("UPDATE users SET role='teacher' WHERE id=?").run(f.alice.id);
    const teacher = {...f.alice,role:'teacher' as const};
    const reservation = await book(f.db,teacher,input({roomId:1,startTime:600,endTime:630}),later);
    assert.equal((await cancel(f.db,teacher,reservation.id,later)).outcome,'teacher');
    assert.equal((await snapshot(f.db,teacher,later)).profile.rating,-1);
  } finally { f.dispose(); }
});
void test('sessions store token hashes, survive reopening the file, and expire', async () => {
  const f = fixture();
  try {
    const request = new Request('https://campus.test/api/campus');
    const cookie = await startSession(f.db,request,NOW);
    assert.ok(cookie?.includes('HttpOnly; SameSite=Strict'));
    assert.ok(cookie?.endsWith('; Secure'));
    const authenticated = new Request(request,{headers:{cookie:cookie!.split(';')[0]}});
    const user = await currentUser(f.db,authenticated,NOW);
    assert.ok(user); assert.equal(user.role,'student');
    const token = cookie!.split(';')[0].split('=')[1];
    assert.notEqual(f.sqlite.prepare('SELECT token_hash FROM sessions').get()?.token_hash,token);
    await book(f.db,user,input(),NOW);
    f.sqlite.close();
    const reopened = new DatabaseSync(f.file);
    try {
      const db = adapter(reopened);
      assert.equal((await currentUser(db,authenticated,NOW))?.id,user.id);
      assert.equal((await snapshot(db,user,NOW)).bookings.length,1);
      assert.equal(await currentUser(db,authenticated,NOW + 181 * 86400000),null);
      assert.equal(await currentUser(db,new Request(request,{headers:{cookie:'campus_session=forged'}}),NOW),null);
    } finally { reopened.close(); }
  } finally { f.dispose(); }
});
void test('a consistent backup restores bookings and sessions, including WAL data', async () => {
  const f = fixture();
  try {
    await book(f.db,f.alice,input(),NOW);
    const { backupDatabase } = await import(pathToFileURL(resolve('scripts/local-db.mjs')).href);
    const copy = join(f.dir,'backup.sqlite');
    backupDatabase(f.file,copy);
    const restored = new DatabaseSync(copy);
    try {
      assert.equal(restored.prepare('PRAGMA integrity_check').get()?.integrity_check,'ok');
      assert.equal((await snapshot(adapter(restored),f.alice,NOW)).bookings.length,1);
    } finally { restored.close(); }
  } finally { f.dispose(); }
});
void test('failed transactions leave no partial writes', async () => {
  const f = fixture();
  try {
    await assert.rejects(f.db.batch([
      f.db.prepare('INSERT INTO users (id,created_at) VALUES (?,?)').bind('rollback',NOW),
      f.db.prepare("INSERT INTO users (id,role,created_at) VALUES (?,'admin',?)").bind('invalid',NOW),
    ]));
    assert.equal(f.sqlite.prepare("SELECT id FROM users WHERE id='rollback'").get(),undefined);
  } finally { f.dispose(); }
});
