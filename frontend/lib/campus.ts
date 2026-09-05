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
export type RoomStatus = 'free' | 'soon' | 'busy';
export type Booking = { start: number; end: number };
export const DEMO_DATE = '2026-09-05';
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

// Replace this demo provider with the availability API when the backend is ready.
export function getSchedule(room: Room, date: string): Booking[] {
  const daySeed =
    Number(date.replaceAll('-', '')) - Number(DEMO_DATE.replaceAll('-', ''));
  const variant = (((room.id + daySeed) % 3) + 3) % 3;
  if (variant === 0)
    return [
      { start: 540, end: 630 },
      { start: 720, end: 780 },
      { start: 960, end: 1050 },
    ];
  if (variant === 1)
    return [
      { start: 600, end: 660 },
      { start: 870, end: 930 },
      { start: 1080, end: 1140 },
    ];
  return [
    { start: 480, end: 540 },
    { start: 810, end: 900 },
    { start: 1020, end: 1080 },
  ];
}
export function formatTime(minutes: number) {
  return (
    String(Math.floor(minutes / 60)).padStart(2, '0') +
    ':' +
    String(minutes % 60).padStart(2, '0')
  );
}
export function formatDate(date: string, short = false) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: short ? 'short' : 'long',
  }).format(new Date(date + 'T12:00:00'));
}
export function getRoomState(room: Room, date: string, time: number) {
  const bookings = getSchedule(room, date);
  const active = bookings.find(
    (booking) => booking.start <= time && booking.end > time,
  );
  if (active)
    return {
      status: 'busy' as RoomStatus,
      label: 'Занято',
      shortLabel: 'До ' + formatTime(active.end),
      description: 'Можно прийти после ' + formatTime(active.end),
      availableAt: active.end,
    };
  const next = bookings.find((booking) => booking.start > time);
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
    };
  return {
    status: 'free' as RoomStatus,
    label: 'Свободно',
    shortLabel: 'Свободно',
    description: next
      ? 'Можно занять до ' + formatTime(next.start)
      : 'Можно занять до 22:00',
    availableAt: time,
  };
}
