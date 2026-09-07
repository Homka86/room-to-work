'use client';
import { useEffect, useSyncExternalStore } from 'react';
import type { UserProfile } from './account';
import type { UserBooking } from './bookings';
import { setScheduleCache } from './campus';

type Snapshot = {
  authenticated: boolean; temporary: boolean; serverTime: number; today: string;
  profile: UserProfile; bookings: UserBooking[]; restrictedRoomIds: number[];
  schedules: { roomId: number; date: string; start: number; end: number }[];
  loading: boolean; error: string | null;
};
const initial: Snapshot = { authenticated: false, temporary: true, serverTime: 0, today: '',
  profile: { role: 'student', rating: 0, blockedUntil: null, freeCancellationsUsed: 0, freeCancellationMonth: '' },
  bookings: [], restrictedRoomIds: [], schedules: [], loading: true, error: null };
let state = initial;
const listeners = new Set<() => void>();
let inFlight: Promise<void> | null = null;
let initialized = false;
let timer: ReturnType<typeof setInterval> | null = null;
function publish(next: Snapshot) { state = next; listeners.forEach(fn => fn()); }
export function getCampusSnapshot() { return state; }
type MutationResult = { success: boolean; error?: string; booking?: UserBooking };
export async function apiRequest<T = MutationResult>(input?: unknown) {
  const response = await fetch('/api/campus', {
    method: input ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
    headers: input ? { 'Content-Type': 'application/json' } : {},
    body: input ? JSON.stringify(input) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(result.error || 'Не удалось выполнить запрос.');
  return result;
}
export function refreshCampus(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      if (!initialized) {
        const initialize = () => apiRequest({ action: 'session' });
        if (navigator.locks) await navigator.locks.request('campus-session', initialize);
        else await initialize();
        initialized = true;
      }
      const next = await apiRequest<Snapshot>();
      if (!next.authenticated) { initialized = false; throw new Error('Сессия истекла. Обновите страницу.'); }
      setScheduleCache(next.schedules, next.today);
      publish({ ...next, loading: false, error: null });
    } catch (error) {
      // Keep the last confirmed data; a failed request must never look like empty storage.
      setScheduleCache(null);
      publish({ ...state, loading: false, error: error instanceof Error ? error.message : 'Нет связи с сервером.' });
    } finally { inFlight = null; }
  })();
  return inFlight;
}
export async function mutateCampus(input: unknown) {
  try {
    const result = await apiRequest(input);
    // Do not let an older in-flight GET overwrite a successful mutation.
    if (inFlight) await inFlight;
    await refreshCampus();
    return result;
  } catch (error) {
    await refreshCampus();
    return { success: false, error: error instanceof Error ? error.message : 'Не удалось сохранить изменения.' };
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => { if (document.visibilityState === 'visible') void refreshCampus(); }, 15000);
    window.addEventListener('focus', refreshCampus);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) { clearInterval(timer); timer = null; window.removeEventListener('focus', refreshCampus); }
  };
}
export function useCampusSnapshot() {
  const snapshot = useSyncExternalStore(subscribe, getCampusSnapshot, () => initial);
  useEffect(() => { void refreshCampus(); }, []);
  return snapshot;
}
