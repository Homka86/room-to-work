import { ROOMS } from '@/lib/campus';
import type { UserRole } from '@/lib/account';

export const ROOM_POPULARITY_STORAGE_KEY = 'campus_room_popularity_v1';
export const ROOM_POPULARITY_DAYS = 30;
export const POPULAR_ROOM_LIMIT = 5;
export const POPULARITY_RATING_LIMIT = 0;

type PopularityEvent = {
  roomId: number;
  createdAt: string;
  expiresAt: string;
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function basePopularity(roomId: number) {
  // Stable demo values keep the ranking useful before the first local booking.
  return 12 + ((roomId * 17 + roomId * roomId) % 29);
}

function readEvents(now = new Date()): PopularityEvent[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(ROOM_POPULARITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const active = parsed.filter(
      (event): event is PopularityEvent =>
        event &&
        typeof event.roomId === 'number' &&
        typeof event.expiresAt === 'string' &&
        new Date(event.expiresAt).getTime() > now.getTime(),
    );
    if (active.length !== parsed.length) {
      localStorage.setItem(ROOM_POPULARITY_STORAGE_KEY, JSON.stringify(active));
    }
    return active;
  } catch {
    return [];
  }
}

export function getPopularityScore(roomId: number, now = new Date()) {
  return (
    basePopularity(roomId) +
    readEvents(now).filter((event) => event.roomId === roomId).length
  );
}

export function getPopularityRanking(now = new Date()) {
  return ROOMS.map((room) => ({
    roomId: room.id,
    score: getPopularityScore(room.id, now),
  })).sort((a, b) => b.score - a.score || a.roomId - b.roomId);
}

export function getPopularityRank(roomId: number, now = new Date()) {
  return (
    getPopularityRanking(now).findIndex((item) => item.roomId === roomId) + 1
  );
}

export function isPopularRoom(roomId: number, now = new Date()) {
  return getPopularityRank(roomId, now) <= POPULAR_ROOM_LIMIT;
}

export function canBookRoomByRating(
  roomId: number,
  rating: number,
  role: UserRole,
  now = new Date(),
) {
  return (
    role === 'teacher' ||
    rating >= POPULARITY_RATING_LIMIT ||
    !isPopularRoom(roomId, now)
  );
}

export function getPopularityRestrictionMessage(
  roomId: number,
  now = new Date(),
) {
  const rank = getPopularityRank(roomId, now);
  return `Коворкинг входит в топ-${POPULAR_ROOM_LIMIT} самых востребованных (место ${rank}). При отрицательном рейтинге доступны менее востребованные пространства.`;
}

export function recordRoomPopularity(roomId: number, now = new Date()) {
  if (!isBrowser()) return;
  const expiresAt = new Date(
    now.getTime() + ROOM_POPULARITY_DAYS * 24 * 60 * 60 * 1000,
  );
  const next: PopularityEvent[] = [
    ...readEvents(now),
    {
      roomId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  ];
  localStorage.setItem(ROOM_POPULARITY_STORAGE_KEY, JSON.stringify(next));
}
