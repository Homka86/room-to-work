import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
globalThis.window = {
  dispatchEvent() {},
  addEventListener() {},
  removeEventListener() {},
};

const account = await import('../lib/account.ts');

beforeEach(() => values.clear());

test('student starts at zero and cancellation can trigger a 7-day block', () => {
  const now = new Date('2026-09-05T12:00:00Z');
  assert.equal(account.getStoredProfile().rating, 0);
  assert.equal(account.getStoredProfile().role, 'student');

  account.applyRatingDelta(account.CANCEL_BOOKING_PENALTY, now);
  const blocked = account.applyRatingDelta(account.CANCEL_BOOKING_PENALTY, now);

  assert.equal(blocked.rating, -4);
  assert.equal(blocked.blockedUntil, '2026-09-12');
  assert.equal(account.isStudentBlocked(blocked, now), true);
});

test('teacher rating is informational and never creates a block', () => {
  account.setUserRole('teacher');
  const afterCancellation = account.applyRatingDelta(
    account.CANCEL_BOOKING_PENALTY,
    new Date('2026-09-05T12:00:00Z'),
  );

  assert.equal(afterCancellation.role, 'teacher');
  assert.equal(afterCancellation.rating, 0);
  assert.equal(afterCancellation.blockedUntil, null);
  assert.equal(account.isStudentBlocked(afterCancellation), false);
});

test('one monthly cancellation allowance is consumed only once', () => {
  const month = new Date('2026-09-05T14:00:00Z');
  assert.equal(account.getFreeCancellationsLeft(undefined, month), 1);

  account.consumeFreeCancellation(month);
  assert.equal(account.getFreeCancellationsLeft(undefined, month), 0);
});
