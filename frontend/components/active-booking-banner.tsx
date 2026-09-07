import { CheckCircle2 } from 'lucide-react';
import { formatTime, formatDate } from '@/lib/campus';
import type { UserBooking } from '@/lib/bookings';
import type { Translation, Language } from '@/lib/translations';

interface ActiveBookingBannerProps {
  booking: UserBooking;
  t: Translation;
  lang: Language;
  onShowOnMap: (floor: number, roomId: number) => void;
  onManage: () => void;
}

export function ActiveBookingBanner({
  booking,
  t,
  lang,
  onShowOnMap,
  onManage,
}: ActiveBookingBannerProps) {
  return (
    <aside
      id="active-booking-banner"
      className="mb-5 p-3.5 sm:p-4 rounded-xl border border-[#d8ccef] dark:border-[#3c3559] bg-[#fbf9fe] dark:bg-[#1d1b2e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
      aria-label={lang === 'ru' ? 'Текущее активное бронирование' : 'Current active booking'}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#eaf7ee] dark:bg-[#193a26] text-[#278557] dark:text-[#52d98c] flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <div className="text-xs font-semibold text-[#7560da] dark:text-[#a896f6] uppercase tracking-wider">
            {t.bookedByMe}
          </div>
          <div className="text-sm font-bold text-foreground">
            {t.coworking} {booking.roomNumber} ({booking.roomFloor} {lang === 'ru' ? 'этаж' : 'floor'}) · {formatDate(booking.date)} {lang === 'ru' ? 'с' : 'from'} {formatTime(booking.startTime)} {lang === 'ru' ? 'до' : 'to'} {formatTime(booking.endTime)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          id="banner-show-room-button"
          type="button"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#cfc3e8] dark:border-[#423d60] bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
          onClick={() => onShowOnMap(booking.roomFloor, booking.roomId)}
        >
          {lang === 'ru' ? 'Показать на схеме' : 'Show on floor plan'}
        </button>
        <button
          id="banner-manage-booking-button"
          type="button"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#7560da] text-white hover:bg-[#644fc9] transition-colors cursor-pointer"
          onClick={onManage}
        >
          {lang === 'ru' ? 'Управление бронью' : 'Manage booking'}
        </button>
      </div>
    </aside>
  );
}
