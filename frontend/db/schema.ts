import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index, check } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  // Reserved for verified university identity. Never accepted from the browser.
  universityId: text('university_id').unique(),
  role: text('role', { enum: ['student', 'teacher'] }).notNull().default('student'),
  createdAt: integer('created_at').notNull(),
}, t => [check('valid_role', sql`${t.role} IN ('student','teacher')`)]);

export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at').notNull(),
}, t => [index('idx_sessions_expiry').on(t.expiresAt)]);

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  roomId: integer('room_id').notNull(),
  date: text('date').notNull(),
  startTime: integer('start_time').notNull(),
  endTime: integer('end_time').notNull(),
  startsAt: integer('starts_at').notNull(),
  endsAt: integer('ends_at').notNull(),
  attendees: integer('attendees').notNull(),
  userName: text('user_name').notNull(),
  purpose: text('purpose').notNull(),
  status: text('status', { enum: ['active','completed','cancelled'] }).notNull().default('active'),
  createdAt: integer('created_at').notNull(),
  cancelledAt: integer('cancelled_at'),
  cancelMonth: text('cancel_month'),
  cancellationOutcome: text('cancellation_outcome'),
  ratingDelta: integer('rating_delta').notNull().default(0),
}, t => [
  index('idx_bookings_user_time').on(t.userId, t.startsAt, t.endsAt),
  index('idx_bookings_room_date').on(t.roomId, t.date, t.status),
  index('idx_bookings_created').on(t.createdAt),
  index('idx_bookings_completion').on(t.status, t.endsAt),
  check('valid_room', sql`${t.roomId} BETWEEN 1 AND 23`),
  check('valid_status', sql`${t.status} IN ('active','completed','cancelled')`),
  check('valid_interval', sql`${t.startTime} >= 480 AND ${t.endTime} <= 1320 AND ${t.endTime} - ${t.startTime} BETWEEN 30 AND 240 AND ${t.startsAt} < ${t.endsAt}`),
  check('valid_attendees', sql`${t.attendees} BETWEEN 1 AND 12`),
]);
