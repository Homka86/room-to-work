import { MIN_BOOKING_ATTENDEES, ROOMS } from '../frontend/lib/campus';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type User = { id: string; role: 'student' | 'teacher'; university_id: string | null };
type Row = { id: string; user_id: string; room_id: number; date: string; start_time: number; end_time: number; starts_at: number; ends_at: number; attendees: number; user_name: string; purpose: string; status: 'active' | 'completed' | 'cancelled'; created_at: number; cancelled_at: number | null; cancel_month: string | null; cancellation_outcome: string | null; rating_delta: number };
const DAY = 86_400_000;
export const COOKIE_NAME = 'campus_session';
export const SESSION_SECONDS = 180 * 86400;
const POPULAR = `SELECT room_id FROM bookings WHERE created_at > ? GROUP BY room_id ORDER BY COUNT(*) DESC, room_id LIMIT 5`;
export function campusDate(now: number) { return new Date(now + 5 * 3600_000).toISOString().slice(0, 10); }
function instant(date: string, minutes: number) { return Date.parse(`${date}T00:00:00+05:00`) + minutes * 60_000; }
export function validDate(date: unknown): date is string {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
async function hash(token: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))), b => b.toString(16).padStart(2, '0')).join('');
}
export async function currentUser(db: D1Database, request: Request, now: number): Promise<User | null> {
  const token = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db.prepare(`SELECT u.id, u.role, u.university_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`).bind(await hash(token), now).first<User>();
}
export async function startSession(db: D1Database, request: Request, now: number) {
  if (await currentUser(db, request, now)) return null;
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  const id = crypto.randomUUID();
  await db.batch([
    db.prepare('INSERT INTO users (id,created_at) VALUES (?,?)').bind(id, now),
    db.prepare('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await hash(token), id, now + SESSION_SECONDS * 1000),
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
  ]);
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
function serializeBooking(row: Row) {
  const room = ROOMS.find(r => r.id === row.room_id)!;
  return { id: row.id, roomId: room.id, roomNumber: room.number, roomFloor: room.floor,
    roomKind: room.kind, roomCapacity: room.capacity, date: row.date,
    startTime: row.start_time, endTime: row.end_time, attendees: row.attendees,
    userName: row.user_name, purpose: row.purpose, status: row.status,
    createdAt: new Date(row.created_at).toISOString() };
}
function complete(db: D1Database, now: number) {
  return db.prepare(`UPDATE bookings SET status='completed', rating_delta=CASE WHEN (SELECT role FROM users WHERE id=bookings.user_id)='student' THEN 1 ELSE 0 END WHERE status='active' AND ends_at<=?`).bind(now);
}
export async function snapshot(db: D1Database, user: User | null, now: number) {
  const today = campusDate(now);
  const lastDay = campusDate(now + 6 * DAY);
  const results = await db.batch<Row>([
    complete(db, now),
    db.prepare(`SELECT room_id, date, start_time, end_time, attendees FROM bookings WHERE date BETWEEN ? AND ? AND status != 'cancelled' ORDER BY date, start_time`).bind(today,lastDay),
    db.prepare('SELECT * FROM bookings WHERE user_id=? ORDER BY starts_at, created_at').bind(user?.id ?? ''),
    db.prepare(POPULAR).bind(now - 30 * DAY),
  ]);
  const rows = results[2].results as Row[];
  const month = today.slice(0,7);
  const rating = rows.reduce((total,r) => total + r.rating_delta,0);
  return {
    serverTime: now, today, authenticated: Boolean(user), temporary: !user?.university_id,
    profile: { role: user?.role ?? 'student', rating, blockedUntil: null,
      freeCancellationMonth: month,
      freeCancellationsUsed: rows.filter(r => r.cancel_month === month && r.cancellation_outcome === 'free_monthly').length },
    bookings: rows.map(serializeBooking),
    restrictedRoomIds: user?.role === 'student' && rating < 0 ? results[3].results.map((r: Row) => r.room_id) : [],
    schedules: results[1].results.map((r: Row) => ({ roomId: r.room_id, date: r.date, start: r.start_time, end: r.end_time, attendees: r.attendees })),
  };
}
export async function book(db: D1Database, user: User, input: Record<string, unknown>, now: number) {
  const { id, roomId, date, startTime, endTime, attendees } = input;
  const room = ROOMS.find(r => r.id === roomId);
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) throw new ApiError(400, 'Некорректный номер запроса.');
  if (!room || !validDate(date)) throw new ApiError(400, 'Выберите комнату и корректную дату.');
  if (typeof startTime !== 'number' || typeof endTime !== 'number' || ![startTime,endTime].every(Number.isInteger) || startTime < 480 || endTime > 1320 || startTime % 30 || endTime % 30 || endTime - startTime < 30 || endTime - startTime > 240)
    throw new ApiError(400, 'Бронирование: от 30 минут до 4 часов, с 08:00 до 22:00, шаг 30 минут.');
  const startsAt = instant(date,startTime), endsAt = instant(date,endTime);
  if (date > campusDate(now + 6 * DAY) || startsAt <= now) throw new ApiError(400, 'Выберите будущее время в ближайшие 7 дней.');
  if (typeof attendees !== 'number' || !Number.isInteger(attendees) || attendees < MIN_BOOKING_ATTENDEES || attendees > room.capacity) throw new ApiError(400, `Укажите от ${MIN_BOOKING_ATTENDEES} до ${room.capacity} участников.`);
  if (typeof input.userName !== 'string' || !input.userName.trim() || input.userName.trim().length > 100 || typeof input.purpose !== 'string' || !input.purpose.trim() || input.purpose.trim().length > 500) throw new ApiError(400, 'Укажите имя (до 100 символов) и цель (до 500 символов).');
  const userName = input.userName.trim(), purpose = input.purpose.trim();
  const results = await db.batch<Row>([
    complete(db, now),
    db.prepare(`INSERT INTO bookings (id,user_id,room_id,date,start_time,end_time,starts_at,ends_at,attendees,user_name,purpose,created_at)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?
      WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE status='active' AND user_id=?)
      AND COALESCE((SELECT SUM(attendees) FROM bookings WHERE status='active' AND room_id=? AND starts_at<? AND ends_at>?),0)+? <= ?
      AND NOT ((SELECT role FROM users WHERE id=?)='student' AND (SELECT COALESCE(SUM(rating_delta),0) FROM bookings WHERE user_id=?)<0 AND ? IN (${POPULAR}))
      ON CONFLICT(id) DO NOTHING`).bind(id,user.id,room.id,date,startTime,endTime,startsAt,endsAt,attendees,userName,purpose,now,user.id,room.id,endsAt,startsAt,attendees,room.capacity,user.id,user.id,room.id,now - 30 * DAY),
    db.prepare('SELECT * FROM bookings WHERE id=? AND user_id=?').bind(id,user.id),
  ]);
  const row = results[2].results[0] as Row | undefined;
  if (!row) throw new ApiError(409, 'Комната или ваше время уже заняты, либо рейтинг ограничивает выбор этого помещения. Обновите расписание и выберите другой вариант.');
  if (row.room_id !== roomId || row.date !== date || row.start_time !== startTime || row.end_time !== endTime || row.attendees !== attendees || row.user_name !== userName || row.purpose !== purpose)
    throw new ApiError(409, 'Этот номер запроса уже использован для другой брони.');
  return serializeBooking(row);
}
export async function cancel(db: D1Database, user: User, id: unknown, now: number) {
  if (typeof id !== 'string' || id.length > 100) throw new ApiError(400, 'Некорректное бронирование.');
  const month = campusDate(now).slice(0,7);
  const results = await db.batch<Row>([
    complete(db, now),
    db.prepare(`UPDATE bookings SET status='cancelled', cancelled_at=?, cancel_month=?,
      cancellation_outcome=CASE WHEN (SELECT role FROM users WHERE id=?)='teacher' THEN 'teacher'
        WHEN starts_at-?>7200000 THEN 'early'
        WHEN NOT EXISTS (SELECT 1 FROM bookings b WHERE b.user_id=? AND b.cancel_month=? AND b.cancellation_outcome='free_monthly') THEN 'free_monthly' ELSE 'penalty' END
      WHERE id=? AND user_id=? AND status='active'`).bind(now,month,user.id,now,user.id,month,id,user.id),
    db.prepare(`UPDATE bookings SET rating_delta=-2 WHERE id=? AND user_id=? AND cancellation_outcome='penalty'`).bind(id,user.id),
    db.prepare('SELECT status,cancellation_outcome FROM bookings WHERE id=? AND user_id=?').bind(id,user.id),
  ]);
  const row = results[3].results[0] as Row | undefined;
  if (!row) throw new ApiError(404, 'Бронирование не найдено.');
  if (row.status === 'completed') throw new ApiError(409, 'Завершённую бронь нельзя отменить.');
  return { outcome: row.cancellation_outcome };
}

export async function setRole(db: D1Database, user: User, role: unknown) {
  if (role !== 'student' && role !== 'teacher') throw new ApiError(400, 'Некорректная роль.');
  await db.prepare('UPDATE users SET role=? WHERE id=?').bind(role, user.id).run();
  return { role };
}
