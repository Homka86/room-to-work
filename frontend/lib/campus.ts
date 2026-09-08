export type Room = {
  id: number;
  number: string;
  floor: number;
  capacity: number;
  kind: string;
  description: string;
  quiet: boolean;
  monitor: boolean;
};
export type RoomStatus = 'free' | 'soon' | 'busy' | 'idle';
export type Booking = { start: number; end: number; attendees: number };
export const MIN_BOOKING_ATTENDEES = 4;
export type RoomState = {
  status: RoomStatus;
  label: string;
  shortLabel: string;
  description: string;
  availableAt?: number;
  untilTime?: number;
  minutesUntilBooking?: number;
  isFreeAllDay?: boolean;
  occupiedSeats?: number;
  remainingSeats?: number;
};
export function getToday() { return new Date(Date.now() + 5 * 3600000).toISOString().slice(0, 10); }
export const FLOOR_NAMES = ['Первый этаж', 'Второй этаж', 'Третий этаж'];
export const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => 480 + i * 30);

// Seeded shuffle keeps all 23 room locations stable across reloads.
function shuffledIds() {
  const ids = Array.from({ length: 23 }, (_, i) => i + 1);
  let seed = 23032026;
  for (let i = ids.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((seed / 4294967296) * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}
const kinds = ['Тихая работа', 'Для команды', 'Для встречи'];
const descriptions = [
  'Спокойное пространство, чтобы сосредоточиться на самом важном.',
  'Обсуждайте идеи, собирайте команду и работайте над общим проектом.',
  'Уютное место для небольшой встречи или работы между занятиями.',
];
export const ROOMS: Room[] = shuffledIds().map((id, index) => ({
  id,
  number: String(id).padStart(2, '0'),
  floor: index < 8 ? 1 : index < 16 ? 2 : 3,
  capacity: [4, 6, 8, 10, 12][id % 5],
  kind: kinds[id % 3],
  description: descriptions[id % 3],
  quiet: id % 3 === 0,
  monitor: id % 2 === 0,
}));

type ScheduleSlot = Booking & { roomId: number; date: string };
let schedules: ScheduleSlot[] = [];
let loadedFrom = '';
export function setScheduleCache(slots: ScheduleSlot[] | null, today = '') {
  if (slots) schedules = slots;
  loadedFrom = slots ? today : '';
}
export function isScheduleLoaded(date: string) {
  return Boolean(loadedFrom && date >= loadedFrom && date <= getUpcomingDays(7, loadedFrom)[6]);
}
export function getSchedule(room: Room, date: string): Booking[] {
  return schedules.filter(slot => slot.roomId === room.id && slot.date === date);
}
export function getOccupiedSeats(bookings: Booking[], start: number, end: number) {
  return bookings
    .filter((booking) => booking.start < end && booking.end > start)
    .reduce((total, booking) => total + (booking.attendees ?? 0), 0);
}
export type ScheduleSegment = { start: number; end: number; attendees: number };
export function getScheduleSegments(bookings: Booking[]): ScheduleSegment[] {
  const points = [...new Set(bookings.flatMap((booking) => [booking.start, booking.end]))].sort((a, b) => a - b);
  const segments: ScheduleSegment[] = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const attendees = getOccupiedSeats(bookings, start, end);
    if (!attendees || start === end) continue;
    const previous = segments[segments.length - 1];
    if (previous && previous.end === start && previous.attendees === attendees) {
      previous.end = end;
    } else {
      segments.push({ start, end, attendees });
    }
  }
  return segments;
}
export function formatTime(minutes: number) {
  return (
    String(Math.floor(minutes / 60)).padStart(2, '0') +
    ':' +
    String(minutes % 60).padStart(2, '0')
  );
}
export function formatDate(date: string, short = false, locale = 'ru-RU') {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: short ? 'short' : 'long',
  }).format(new Date(date + 'T12:00:00'));
}
export function getRoomState(room: Room, date: string, time: number): RoomState {
  if (!isScheduleLoaded(date)) return { status: 'idle', label: 'Расписание обновляется', shortLabel: 'Обновление', description: 'Дождитесь загрузки расписания.' };
  const bookings = getSchedule(room, date);
  const active = bookings.filter(
    (booking) => booking.start <= time && booking.end > time,
  );
  const occupiedSeats = active.reduce((total, booking) => total + (booking.attendees ?? 0), 0);
  const remainingSeats = Math.max(0, room.capacity - occupiedSeats);
  const next = bookings
    .filter((booking) => booking.start > time)
    .sort((a, b) => a.start - b.start)[0];
  if (remainingSeats === 0)
    return {
      status: 'busy' as RoomStatus,
      label: 'Занято',
      shortLabel: 'Занято полностью',
      description: 'Все места заняты на выбранное время.',
      occupiedSeats,
      remainingSeats,
    };
  if (next && next.start - time <= 30)
    return {
      status: 'soon' as RoomStatus,
      label: 'Скоро будет занято',
      shortLabel: 'Бронь в ' + formatTime(next.start),
      description:
        'Свободно ещё ' +
        (next.start - time) +
        ' мин, до ' +
        formatTime(next.start),
      availableAt: time,
      untilTime: next.start,
      minutesUntilBooking: next.start - time,
      occupiedSeats,
      remainingSeats,
    };
  return {
    status: 'free' as RoomStatus,
    label: 'Свободно',
    shortLabel: remainingSeats < room.capacity ? `Свободно мест: ${remainingSeats}` : 'Свободно',
    description: next
      ? 'Можно занять до ' + formatTime(next.start)
      : 'Можно занять до 22:00',
    availableAt: time,
    untilTime: next?.start,
    isFreeAllDay: !next,
    occupiedSeats,
    remainingSeats,
  };
}

/**
 * Returns a neutral state until the user chooses both date and time.
 * The daily schedule remains visible in the details panel in that state.
 */
export function getRoomAvailability(
  room: Room,
  date?: string | null,
  time?: number | null,
): RoomState {
  if (!date && (time === null || time === undefined)) {
    return {
      status: 'idle',
      label: 'Занятость на день',
      shortLabel: 'Занятость в расписании',
      description: 'Подробное расписание комнаты показано ниже.',
    };
  }
  if (!date) {
    return {
      status: 'idle',
      label: 'Занятость на день',
      shortLabel: 'Выберите дату',
      description: 'Выберите дату, чтобы увидеть актуальный статус.',
    };
  }
  if (time === null || time === undefined) {
    return {
      status: 'idle',
      label: 'Занятость на день',
      shortLabel: 'Выберите время',
      description: 'Выберите время, чтобы увидеть актуальный статус.',
    };
  }
  return getRoomState(room, date, time);
}

export function getUpcomingDays(count = 7, fromDate = getToday()): string[] {
  const base = new Date(`${fromDate}T12:00:00`);
  return Array.from({ length: count }, (_, index) => {
    const next = new Date(base);
    next.setDate(base.getDate() + index);
    return next.toISOString().slice(0, 10);
  });
}
