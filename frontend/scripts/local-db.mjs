import { DatabaseSync } from 'node:sqlite';
import { existsSync, readdirSync, mkdirSync, chmodSync, renameSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function backupDatabase(source, destination) {
  mkdirSync(resolve(destination, '..'), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(source, { readOnly: true });
  const temporary = destination + '.tmp';
  try {
    if (db.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('Database integrity check failed');
    db.prepare('VACUUM INTO ?').run(temporary);
    chmodSync(temporary, 0o600);
    const copy = new DatabaseSync(temporary, { readOnly: true });
    try { if (copy.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('Backup verification failed'); }
    finally { copy.close(); }
    renameSync(temporary, destination);
    return destination;
  } finally { db.close(); if (existsSync(temporary)) unlinkSync(temporary); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
  const candidates = existsSync(directory) ? readdirSync(directory).filter(x => x.endsWith('.sqlite')).map(x => join(directory,x)) : [];
  let source;
  for (const path of candidates) {
    const db = new DatabaseSync(path, { readOnly: true });
    try { if (db.prepare("SELECT name FROM sqlite_master WHERE name='bookings' AND type='table'").get()) source = path; }
    finally { db.close(); }
  }
  if (!source) {
    if (process.argv.includes('--if-exists')) console.log('No local campus database yet; nothing to back up.');
    else { console.error('Run pnpm db:migrate first. No local campus database found.'); process.exitCode = 1; }
  } else {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    console.log('Verified SQLite backup:', backupDatabase(source, resolve('backups', `campus-${stamp}.sqlite`)));
  }
}
