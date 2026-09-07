import type { CSSProperties } from 'react';
import { ArrowUpRight, Bookmark, Check, Users } from 'lucide-react';
import { formatTime, type Room, type RoomState } from '@/lib/campus';
import type { Translation, Language } from '@/lib/translations';

interface RoomCardProps {
  room: Room;
  availability: RoomState;
  selectedId: number;
  isBookedByMe: boolean;
  dimmed?: boolean;
  index: number;
  t: Translation;
  lang: Language;
  onSelect: (id: number) => void;
}

export function RoomCard({
  room,
  availability,
  selectedId,
  isBookedByMe,
  dimmed = false,
  index,
  t,
  lang,
  onSelect,
}: RoomCardProps) {
  let statusDisplay = availability.shortLabel;
  if (isBookedByMe) {
    statusDisplay = t.bookedByMe;
  } else if (availability.status === 'free') {
    if (availability.isFreeAllDay) {
      statusDisplay = lang === 'ru' ? 'Свободен весь день' : 'Free all day';
    } else if (availability.untilTime) {
      statusDisplay =
        lang === 'ru'
          ? `Свободно до ${formatTime(availability.untilTime)}`
          : `Free until ${formatTime(availability.untilTime)}`;
    } else {
      statusDisplay = lang === 'ru' ? 'Свободно' : 'Free';
    }
  } else if (availability.status === 'soon') {
    const diff = availability.minutesUntilBooking ?? 60;
    if (diff >= 60) {
      statusDisplay = lang === 'ru' ? 'Займут в течение 1 часа' : 'Occupied within 1 hour';
    } else {
      statusDisplay =
        lang === 'ru' ? `Займут в течение ${diff} мин` : `Occupied within ${diff} min`;
    }
  } else if (availability.status === 'busy') {
    if (availability.untilTime) {
      statusDisplay =
        lang === 'ru'
          ? `Занято до ${formatTime(availability.untilTime)}`
          : `Occupied until ${formatTime(availability.untilTime)}`;
    } else {
      statusDisplay = lang === 'ru' ? 'Занято' : 'Occupied';
    }
  } else if (availability.status === 'idle') {
    statusDisplay =
      availability.shortLabel === 'Занятость в расписании'
        ? t.selectDateTime
        : availability.shortLabel === 'Выберите дату'
        ? t.selectDatePrompt
        : t.selectTimePrompt;
  }

  const isSelected = room.id === selectedId;

  return (
    <button
      id={`room-card-${room.id}`}
      type="button"
      className={
        'room room-' +
        availability.status +
        (isSelected ? ' room-selected' : '') +
        (dimmed ? ' room-dimmed' : '') +
        (isBookedByMe ? ' ring-2 ring-[#7560da] ring-offset-2' : '')
      }
      onClick={() => onSelect(room.id)}
      disabled={dimmed}
      aria-pressed={isSelected}
      aria-label={
        `${t.coworking} ${room.number}, ${statusDisplay}, ${room.capacity} ${t.seats}` +
        (isBookedByMe ? (lang === 'ru' ? ', забронировано вами' : ', booked by you') : '')
      }
      style={{ '--room-delay': index * 35 + 'ms' } as CSSProperties}
    >
      <span className="room-top">
        <span className="room-code">К{room.number}</span>
        {isBookedByMe ? (
          <span
            id={`room-user-badge-${room.id}`}
            className="px-1.5 py-0.5 rounded bg-[#7560da] text-white text-[10px] font-bold flex items-center gap-0.5"
            title={lang === 'ru' ? 'Ваша активная бронь' : 'Your active booking'}
          >
            <Bookmark size={11} />
            {lang === 'ru' ? 'Вы' : 'You'}
          </span>
        ) : isSelected ? (
          <span className="selected-mark">
            <Check size={13} />
          </span>
        ) : (
          <ArrowUpRight size={17} className="room-arrow" />
        )}
      </span>

      <span className="room-capacity">
        <Users size={13} />
        {room.capacity} {t.seats}
      </span>

      <span className="room-bottom" title={statusDisplay}>
        <span className="status-dot" />
        <span className="truncate">{statusDisplay}</span>
      </span>
    </button>
  );
}
