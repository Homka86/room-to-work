'use client';

import { useCallback, useEffect, useState } from 'react';

export type UserRole = 'student' | 'teacher';

export type UserProfile = {
  role: UserRole;
  rating: number;
  blockedUntil: string | null;
  freeCancellationsUsed: number;
  freeCancellationMonth: string;
};

export const ACCOUNT_STORAGE_KEY = 'campus_user_profile_v1';
export const ACCOUNT_CHANGED_EVENT = 'campus_user_profile_changed';

export const INITIAL_RATING = 0;
export const COMPLETED_BOOKING_REWARD = 1;
export const CANCEL_BOOKING_PENALTY = -2;
export const RATING_BLOCK_THRESHOLD = -3;
export const RATING_BLOCK_DAYS = 7;
export const FREE_CANCELLATIONS_PER_MONTH = 1;

const DEFAULT_PROFILE: UserProfile = {
  role: 'student',
  rating: INITIAL_RATING,
  blockedUntil: null,
  freeCancellationsUsed: 0,
  freeCancellationMonth: '',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(value + 'T12:00:00Z');
  return Number.isNaN(parsed.getTime()) ? null : value;
}

function normalizeProfile(value: unknown): UserProfile {
  if (!value || typeof value !== 'object') return { ...DEFAULT_PROFILE };
  const candidate = value as Partial<UserProfile>;
  const rating = Number(candidate.rating);
  const freeCancellationsUsed = Number(candidate.freeCancellationsUsed);
  return {
    role: candidate.role === 'teacher' ? 'teacher' : 'student',
    rating: Number.isFinite(rating) ? Math.round(rating) : INITIAL_RATING,
    blockedUntil: normalizeDate(candidate.blockedUntil),
    freeCancellationsUsed:
      Number.isFinite(freeCancellationsUsed) && freeCancellationsUsed >= 0
        ? Math.floor(freeCancellationsUsed)
        : 0,
    freeCancellationMonth:
      typeof candidate.freeCancellationMonth === 'string'
        ? candidate.freeCancellationMonth
        : '',
  };
}

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getStoredProfile(): UserProfile {
  if (!isBrowser()) return { ...DEFAULT_PROFILE };
  try {
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    return raw ? normalizeProfile(JSON.parse(raw)) : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function persistProfile(profile: UserProfile): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent(ACCOUNT_CHANGED_EVENT));
  } catch (error) {
    console.error('Failed to save user profile:', error);
  }
}

export function isStudentBlocked(
  profile = getStoredProfile(),
  now = new Date(),
): boolean {
  if (profile.role !== 'student' || !profile.blockedUntil) return false;
  const blockedThrough = new Date(profile.blockedUntil + 'T23:59:59');
  return blockedThrough.getTime() >= now.getTime();
}

function addDays(date: Date, days: number): string {
  const result = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function formatRating(rating: number): string {
  return rating > 0 ? `+${rating}` : String(rating);
}

export function getFreeCancellationsLeft(
  profile = getStoredProfile(),
  now = new Date(),
): number {
  if (profile.role !== 'student') return FREE_CANCELLATIONS_PER_MONTH;
  if (profile.freeCancellationMonth !== monthKey(now)) {
    return FREE_CANCELLATIONS_PER_MONTH;
  }
  return Math.max(
    0,
    FREE_CANCELLATIONS_PER_MONTH - profile.freeCancellationsUsed,
  );
}

export function consumeFreeCancellation(now = new Date()): UserProfile {
  const current = getStoredProfile();
  const currentMonth = monthKey(now);
  const usedThisMonth =
    current.freeCancellationMonth === currentMonth
      ? current.freeCancellationsUsed
      : 0;
  const next = {
    ...current,
    freeCancellationsUsed: usedThisMonth + 1,
    freeCancellationMonth: currentMonth,
  };
  persistProfile(next);
  return next;
}

export function setUserRole(role: UserRole): UserProfile {
  const next = { ...getStoredProfile(), role };
  persistProfile(next);
  return next;
}

/** Applies a rating event. Teachers keep their score but never get blocked. */
export function applyRatingDelta(
  delta: number,
  now = new Date(),
): UserProfile {
  const current = getStoredProfile();
  if (current.role === 'teacher') return current;

  const rating = current.rating + delta;
  const canStartNewBlock =
    !current.blockedUntil || !isStudentBlocked(current, now);
  const blockedUntil =
    rating <= RATING_BLOCK_THRESHOLD && canStartNewBlock
      ? addDays(now, RATING_BLOCK_DAYS)
      : current.blockedUntil;

  const next = { ...current, rating, blockedUntil };
  persistProfile(next);
  return next;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() =>
    getStoredProfile(),
  );

  const refresh = useCallback(() => {
    setProfile(getStoredProfile());
  }, []);

  useEffect(() => {
    window.addEventListener(ACCOUNT_CHANGED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(ACCOUNT_CHANGED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const changeRole = useCallback((role: UserRole) => {
    const next = setUserRole(role);
    setProfile(next);
    return next;
  }, []);

  return { profile, refresh, setRole: changeRole };
}
