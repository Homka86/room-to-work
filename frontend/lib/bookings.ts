'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DEMO_DATE,
  formatTime,
  formatDate,
  type Room,
} from '@/lib/campus';

export type BookingStatus = 'active' | 'completed' | 'cancelled';

export type UserBooking = {
  id: string;
  roomId: number;
  roomNumber: string;
  roomFloor: number;
  roomKind: string;
  roomCapacity: number;
  date: string;
  startTime: number;
  endTime: number;
  userName: string;
  purpose: string;
  status: BookingStatus;
  createdAt: string;
};

export const BOOKINGS_STORAGE_KEY = 'campus_user_bookings_v1';
export const BOOKINGS_CHANGED_EVENT = 'campus_user_bookings_changed';

export const POPULAR_PURPOSES = [
  'Командный проект',
  'Онлайн-созвон',
  'Встреча и обсуждение',
];

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Checks whether a booking has naturally passed its end time
 * based on the provided reference date and time.
 */
export function isBookingExpired(
  booking: UserBooking,
  currentDate = DEMO_DATE,
  currentTime = 840,
): boolean {
  if (booking.status === 'cancelled') return false;
  if (booking.date < currentDate) return true;
  if (booking.date === currentDate && booking.endTime <= currentTime) return true;
  return false;
}

/**
 * Reads all bookings from local storage and recalculates completed states.
 */
export function getStoredBookings(
  currentDate = DEMO_DATE,
  currentTime = 840,
): UserBooking[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: UserBooking[] = JSON.parse(raw);
    let changed = false;

    const normalized = parsed.map((item) => {
      if (item.status === 'active' && isBookingExpired(item, currentDate, currentTime)) {
        changed = true;
        return { ...item, status: 'completed' as const };
      }
      return item;
    });

    if (changed) {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return [];
  }
}

/**
 * Persists bookings to local storage and broadcasts update event.
 */
export function persistBookings(bookings: UserBooking[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    window.dispatchEvent(new CustomEvent(BOOKINGS_CHANGED_EVENT));
  } catch (error) {
    console.error('Failed to save bookings:', error);
  }
}

/**
 * Returns the currently active booking for the user, if any.
 * By campus rules, a user may hold at most one active booking.
 */
export function getActiveUserBooking(
  currentDate = DEMO_DATE,
  currentTime = 840,
): UserBooking | null {
  const bookings = getStoredBookings(currentDate, currentTime);
  return bookings.find((b) => b.status === 'active') ?? null;
}

/**
 * Checks whether the user is permitted to book the specified room.
 */
export function evaluateBookingPermission(
  roomId: number,
  currentDate = DEMO_DATE,
  currentTime = 840,
): {
  allowed: boolean;
  isSameRoomBooked: boolean;
  activeBooking: UserBooking | null;
  message?: string;
} {
  const active = getActiveUserBooking(currentDate, currentTime);
  if (!active) {
    return { allowed: true, isSameRoomBooked: false, activeBooking: null };
  }

  if (active.roomId === roomId) {
    return {
      allowed: false,
      isSameRoomBooked: true,
      activeBooking: active,
      message: `Это помещение уже забронировано вами на ${formatDate(active.date)} (${formatTime(active.startTime)} — ${formatTime(active.endTime)}).`,
    };
  }

  return {
    allowed: false,
    isSameRoomBooked: false,
    activeBooking: active,
    message: `У вас уже есть активная бронь коворкинга К${active.roomNumber} (${active.roomFloor} этаж). По правилам кампуса нельзя забронировать другое помещение, пока не отменена текущая бронь.`,
  };
}

/**
 * Creates a new reservation if the user does not have an active booking.
 */
export function createNewBooking({
  room,
  date,
  startTime,
  endTime,
  userName,
  purpose,
}: {
  room: Room;
  date: string;
  startTime: number;
  endTime: number;
  userName: string;
  purpose: string;
}): { success: boolean; error?: string; booking?: UserBooking } {
  const trimmedName = userName.trim();
  const trimmedPurpose = purpose.trim();

  if (!trimmedName) {
    return { success: false, error: 'Пожалуйста, укажите ваше имя.' };
  }
  if (!trimmedPurpose) {
    return { success: false, error: 'Пожалуйста, укажите цель посещения.' };
  }
  if (endTime <= startTime) {
    return {
      success: false,
      error: 'Время окончания брони должно быть позже времени начала.',
    };
  }
  if (endTime - startTime < 30) {
    return {
      success: false,
      error: 'Минимальное время бронирования — 30 минут.',
    };
  }
  if (endTime - startTime > 240) {
    return {
      success: false,
      error: 'Максимальное время бронирования — 4 часа.',
    };
  }

  const check = evaluateBookingPermission(room.id, date, startTime);
  if (!check.allowed) {
    return { success: false, error: check.message };
  }

  const newBooking: UserBooking = {
    id: 'booking_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    roomId: room.id,
    roomNumber: room.number,
    roomFloor: room.floor,
    roomKind: room.kind,
    roomCapacity: room.capacity,
    date,
    startTime,
    endTime,
    userName: trimmedName,
    purpose: trimmedPurpose,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const existing = getStoredBookings();
  persistBookings([newBooking, ...existing]);

  return { success: true, booking: newBooking };
}

/**
 * Cancels an existing booking by its ID.
 */
export function cancelExistingBooking(bookingId: string): {
  success: boolean;
  error?: string;
} {
  const all = getStoredBookings();
  const target = all.find((b) => b.id === bookingId);
  if (!target) {
    return { success: false, error: 'Бронирование не найдено.' };
  }

  const updated = all.map((b) =>
    b.id === bookingId ? { ...b, status: 'cancelled' as const } : b,
  );
  persistBookings(updated);
  return { success: true };
}

/**
 * Formats duration in minutes to readable Russian text (e.g. 90 -> "1 ч 30 мин").
 */
export function formatBookingDuration(start: number, end: number): string {
  const diff = end - start;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours > 0 && minutes > 0) return `${hours} ч ${minutes} мин`;
  if (hours > 0) return `${hours} ч`;
  return `${minutes} мин`;
}

/**
 * React hook to synchronize booking state across components and storage events.
 */
export function useUserBookings(referenceDate = DEMO_DATE, referenceTime = 840) {
  const [bookings, setBookings] = useState<UserBooking[]>(() => {
    return isBrowser() ? getStoredBookings(referenceDate, referenceTime) : [];
  });

  const refresh = useCallback(() => {
    setBookings(getStoredBookings(referenceDate, referenceTime));
  }, [referenceDate, referenceTime]);

  useEffect(() => {
    const handleUpdate = () => refresh();
    window.addEventListener(BOOKINGS_CHANGED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(BOOKINGS_CHANGED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refresh]);

  const activeBooking = bookings.find((b) => b.status === 'active') ?? null;
  const completedBookings = bookings.filter((b) => b.status === 'completed');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  const checkPermission = useCallback(
    (roomId: number) => {
      return evaluateBookingPermission(roomId, referenceDate, referenceTime);
    },
    [referenceDate, referenceTime],
  );

  const cancel = useCallback((bookingId: string) => {
    const res = cancelExistingBooking(bookingId);
    if (res.success) refresh();
    return res;
  }, [refresh]);

  const cancelActive = useCallback(() => {
    if (!activeBooking) return { success: false, error: 'Нет активной брони.' };
    return cancel(activeBooking.id);
  }, [activeBooking, cancel]);

  const book = useCallback(
    (params: {
      room: Room;
      date: string;
      startTime: number;
      endTime: number;
      userName: string;
      purpose: string;
    }) => {
      const res = createNewBooking(params);
      if (res.success) refresh();
      return res;
    },
    [refresh],
  );

  return {
    bookings,
    activeBooking,
    completedBookings,
    cancelledBookings,
    checkPermission,
    book,
    cancel,
    cancelActive,
    refresh,
  };
}
