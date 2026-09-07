import { getCampusSnapshot } from './campus-store';
import type { UserRole } from './account';
export const ROOM_POPULARITY_DAYS = 30;
export const POPULAR_ROOM_LIMIT = 5;
export const POPULARITY_RATING_LIMIT = 0;
export function canBookRoomByRating(roomId: number, _rating: number, _role: UserRole) {
  return !getCampusSnapshot().restrictedRoomIds.includes(roomId);
}
export function getPopularityRestrictionMessage(_roomId?: number) {
  return 'При вашем рейтинге доступны менее востребованные пространства.';
}
