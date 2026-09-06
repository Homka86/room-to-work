'use client';

import type { CSSProperties } from 'react';
import { ArrowUpRight, Bookmark, Check, Users } from 'lucide-react';
import type { Room, getRoomState } from '@/lib/campus';

type RoomCardProps = {
  room: Room;
  availability: ReturnType<typeof getRoomState> | null;
  index: number;
  selected: boolean;
  dimmed: boolean;
  isBookedByMe: boolean;
  onSelect: (id: number) => void;
};

export function RoomCard({
  room,
  availability,
  index,
  selected,
  dimmed,
  isBookedByMe,
  onSelect,
}: RoomCardProps) {
  return (
    <button
      id={`room-card-${room.id}`}
      type="button"
      key={room.id}
      className={
        'room room-' +
        (availability?.status ?? 'neutral') +
        (selected ? ' room-selected' : '') +
        (dimmed ? ' room-dimmed' : '') +
        (isBookedByMe ? ' ring-2 ring-urfu-blue ring-offset-2' : '')
      }
      onClick={() => onSelect(room.id)}
      disabled={dimmed}
      aria-pressed={selected}
      aria-label={
        'Коворкинг ' +
        room.number +
        ', ' +
        (availability?.label ?? 'Выберите дату и время') +
        ', ' +
        room.capacity +
        ' мест' +
        (isBookedByMe ? ', забронировано вами' : '')
      }
      style={{ '--room-delay': index * 35 + 'ms' } as CSSProperties}
    >
      <span className="room-top">
        <span className="room-code">К{room.number}</span>
        {isBookedByMe ? (
          <span
            id={`room-user-badge-${room.id}`}
            className="px-1.5 py-0.5 rounded bg-primary text-white text-[10px] font-bold flex items-center gap-0.5"
            title="Ваша активная бронь"
          >
            <Bookmark size={11} />
            Вы
          </span>
        ) : selected ? (
          <span className="selected-mark">
            <Check size={13} />
          </span>
        ) : (
          <ArrowUpRight size={17} className="room-arrow" />
        )}
      </span>
      <span className="room-type">{room.kind}</span>
      <span className="room-capacity">
        <Users size={14} />
        {room.capacity} мест
      </span>
      <span className="room-bottom">
        <span className="status-dot" />
        {isBookedByMe
          ? 'Ваша бронь'
          : (availability?.shortLabel ?? 'Выберите дату и время')}
      </span>
    </button>
  );
}
