'use client';
import { formatTime, type Room } from './campus';
import { getStoredProfile, getFreeCancellationsLeft } from './account';
import { getCampusSnapshot, useCampusSnapshot, refreshCampus, mutateCampus } from './campus-store';
import { BOOKING_PURPOSES } from './purposes';
export type BookingStatus = 'active' | 'completed' | 'cancelled';
export type UserBooking = { id: string; roomId: number; roomNumber: string; roomFloor: number; roomKind: string; roomCapacity: number; date: string; startTime: number; endTime: number; attendees: number; userName: string; purpose: string; status: BookingStatus; createdAt: string };
export type CancellationOutcome = 'early' | 'free_monthly' | 'penalty' | 'teacher';
export const POPULAR_PURPOSES = BOOKING_PURPOSES;
export function getCancellationOutcome(booking: UserBooking): CancellationOutcome {
  const profile = getStoredProfile();
  if (profile.role === 'teacher') return 'teacher';
  const now = getCampusSnapshot().serverTime || Date.now();
  const start = Date.parse(`${booking.date}T${formatTime(booking.startTime)}:00+05:00`);
  if (start - now > 7200000) return 'early';
  return getFreeCancellationsLeft(profile,new Date(now)) > 0 ? 'free_monthly' : 'penalty';
}
export function getCancellationMessage(outcome: CancellationOutcome) {
  return { early: 'До начала больше 2 часов — рейтинг и бесплатная отмена сохранятся.', free_monthly: 'Одна бесплатная отмена в этом месяце — рейтинг сохранится.', penalty: 'Бесплатная отмена использована — рейтинг уменьшится на 2 балла.', teacher: 'Отмена не влияет на рейтинг.' }[outcome];
}
export function evaluateBookingPermission(roomId: number, date?: string, startTime?: number | null, endTime?: number | null) {
  const state = getCampusSnapshot();
  const active = date && startTime != null ? state.bookings.find(b => b.status === 'active' && b.date === date && b.startTime < (endTime ?? startTime + 30) && b.endTime > startTime) ?? null : null;
  const blockedByPopularity = state.restrictedRoomIds.includes(roomId);
  return { allowed: state.authenticated && !state.error && !active && !blockedByPopularity,
    isSameRoomBooked: active?.roomId === roomId, activeBooking: active, blockedByPopularity,
    message: blockedByPopularity ? 'При вашем рейтинге доступны менее востребованные пространства.' : active ? 'На это время у вас уже есть бронирование.' : state.error || undefined };
}
type BookingInput = { room: Room; date: string; startTime: number; endTime: number; attendees: number; userName: string; purpose: string };
let pending: { fingerprint: string; id: string } | null = null;
export async function createNewBooking({ room, ...params }: BookingInput): Promise<{ success: boolean; error?: string; booking?: UserBooking }> {
  const payload = { ...params, roomId: room.id };
  const fingerprint = JSON.stringify(payload);
  if (!pending || pending.fingerprint !== fingerprint) pending = { fingerprint, id: crypto.randomUUID() };
  const result = await mutateCampus({ action: 'book', id: pending.id, ...payload });
  if (result.success) pending = null;
  return result;
}
export function cancelExistingBooking(id: string): Promise<{ success: boolean; error?: string }> { return mutateCampus({ action: 'cancel', id }); }
export function formatBookingDuration(start: number, end: number) {
  const hours = Math.floor((end-start)/60), minutes = (end-start)%60;
  return [hours ? `${hours} ч` : '', minutes ? `${minutes} мин` : ''].filter(Boolean).join(' ');
}
export function useUserBookings(_referenceDate?: string, _referenceTime?: number) {
  const state = useCampusSnapshot();
  const activeBookings = state.bookings.filter(b => b.status === 'active');
  return { ...state, activeBookings, activeBooking: activeBookings[0] ?? null,
    completedBookings: state.bookings.filter(b => b.status === 'completed'),
    cancelledBookings: state.bookings.filter(b => b.status === 'cancelled'),
    cancel: cancelExistingBooking, book: createNewBooking, refresh: refreshCampus,
    checkPermission: evaluateBookingPermission };
}
