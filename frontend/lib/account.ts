'use client';
import { getCampusSnapshot, useCampusSnapshot, refreshCampus } from './campus-store';
export type UserRole = 'student' | 'teacher';
export type UserProfile = { role: UserRole; rating: number; blockedUntil: string | null; freeCancellationsUsed: number; freeCancellationMonth: string };
export const INITIAL_RATING = 0;
export const COMPLETED_BOOKING_REWARD = 1;
export const CANCEL_BOOKING_PENALTY = -2;
export const FREE_CANCELLATIONS_PER_MONTH = 1;
export function getStoredProfile() { return getCampusSnapshot().profile; }
export function formatRating(rating: number) { return rating > 0 ? `+${rating}` : String(rating); }
export function getFreeCancellationsLeft(profile = getStoredProfile(), now = new Date()) {
  const month = new Date(now.getTime() + 5 * 3600000).toISOString().slice(0,7);
  return profile.freeCancellationMonth !== month ? 1 : Math.max(0, 1 - profile.freeCancellationsUsed);
}
export function useUserProfile() {
  const { profile } = useCampusSnapshot();
  return { profile, refresh: refreshCampus };
}
