'use client';

import { ArrowRight, CheckCircle2, Info } from 'lucide-react';
import type { Room, RoomState } from '@/lib/campus';
import type { Translation, Language } from '@/lib/translations';

interface MobileBottomBarProps {
  room?: Room;
  availability?: RoomState;
  isThisRoomBooked: boolean;
  isOtherRoomBooked: boolean;
  lang: Language;
  t: Translation;
  onOpenBookingDialog: () => void;
  onViewDetails: () => void;
}

export function MobileBottomBar({
  isThisRoomBooked,
  isOtherRoomBooked,
  lang,
  onOpenBookingDialog,
  onViewDetails,
}: MobileBottomBarProps) {
  return (
    <aside
      id="mobile-room-bottom-bar"
      aria-label={lang === 'ru' ? 'Панель действий' : 'Action bar'}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform duration-200"
    >
      <div className="flex items-center gap-2.5 max-w-md mx-auto w-full">
        {/* Кнопка информации */}
        <button
          id="mobile-room-details-trigger"
          type="button"
          onClick={onViewDetails}
          aria-label={lang === 'ru' ? 'Информация о коворкинге' : 'Room details'}
          className="inline-flex items-center justify-center gap-1.5 h-12 px-4 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold text-foreground transition-all active:scale-95 touch-manipulation cursor-pointer shrink-0"
        >
          <Info size={18} className="text-primary shrink-0" />
          <span>{lang === 'ru' ? 'Инфо' : 'Info'}</span>
        </button>

        {/* Кнопка бронирования */}
        <button
          id="mobile-room-book-trigger"
          type="button"
          onClick={onOpenBookingDialog}
          disabled={isOtherRoomBooked}
          className={`flex-1 inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-sm font-bold transition-all shadow-xs active:scale-95 touch-manipulation cursor-pointer ${
            isOtherRoomBooked
              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <span>
            {isThisRoomBooked
              ? lang === 'ru'
                ? 'Моя бронь'
                : 'My booking'
              : isOtherRoomBooked
              ? lang === 'ru'
                ? 'Бронь есть'
                : 'Has booking'
              : lang === 'ru'
              ? 'Забронировать'
              : 'Book'}
          </span>
          {isOtherRoomBooked ? <CheckCircle2 size={17} /> : <ArrowRight size={17} />}
        </button>
      </div>
    </aside>
  );
}

