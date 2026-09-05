import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROOMS,
  DEMO_DATE,
  TIME_OPTIONS,
  getSchedule,
  getRoomState,
} from '../lib/campus.ts';

test('all 23 unique coworkings are assigned to exactly three floors', () => {
  assert.equal(ROOMS.length, 23);
  assert.equal(new Set(ROOMS.map((room) => room.id)).size, 23);
  assert.deepEqual(
    [1, 2, 3].map(
      (floor) => ROOMS.filter((room) => room.floor === floor).length,
    ),
    [8, 8, 7],
  );
  assert.ok(ROOMS.every((room) => room.capacity > 0));
});

test('green, yellow and red are all represented at demo time', () => {
  assert.deepEqual(
    new Set(ROOMS.map((room) => getRoomState(room, DEMO_DATE, 840).status)),
    new Set(['free', 'soon', 'busy']),
  );
});

test('booking boundaries and the 30-minute warning are precise', () => {
  const room = ROOMS.find((room) => room.id === 1);
  assert.equal(getRoomState(room, DEMO_DATE, 839).status, 'free');
  assert.equal(getRoomState(room, DEMO_DATE, 840).status, 'soon');
  assert.equal(getRoomState(room, DEMO_DATE, 869).status, 'soon');
  assert.equal(getRoomState(room, DEMO_DATE, 870).status, 'busy');
  assert.equal(getRoomState(room, DEMO_DATE, 929).status, 'busy');
  assert.equal(getRoomState(room, DEMO_DATE, 930).status, 'free');
});

test('changing date changes demo availability without relocating rooms', () => {
  const room = ROOMS.find((room) => room.id === 1);
  assert.notDeepEqual(
    getSchedule(room, DEMO_DATE),
    getSchedule(room, '2026-09-06'),
  );
  assert.notEqual(
    getRoomState(room, DEMO_DATE, 840).status,
    getRoomState(room, '2026-09-06', 840).status,
  );
  assert.equal(new Set(ROOMS.map((room) => room.number)).size, 23);
});

test('every offered time has a valid state and schedules stay within opening hours', () => {
  for (const room of ROOMS) {
    for (const time of TIME_OPTIONS)
      assert.ok(
        ['free', 'soon', 'busy'].includes(
          getRoomState(room, DEMO_DATE, time).status,
        ),
      );
    const bookings = getSchedule(room, DEMO_DATE);
    bookings.forEach((booking, i) => {
      assert.ok(
        booking.start >= 480 &&
          booking.end <= 1320 &&
          booking.start < booking.end,
      );
      if (i > 0) assert.ok(bookings[i - 1].end <= booking.start);
    });
  }
});
