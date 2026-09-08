'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Trash2,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/campus';
import {
  useUserBookings,
  getCancellationMessage,
  getCancellationOutcome,
  type UserBooking,
} from '@/lib/bookings';
import { type Language, type Translation } from '@/lib/translations';

interface BookingListProps {
  bookings: UserBooking[];
  lang: Language;
  t: Translation;
  onSelectRoom?: (id: number) => void;
}

export function BookingList({ bookings, lang, t, onSelectRoom }: BookingListProps) {
  const { cancel } = useUserBookings();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function handleCancel(id: string) {
    if (pendingId) return;
    setPendingId(id);
    setError('');
    const result = await cancel(id);
    setPendingId(null);
    if (result.success) {
      setConfirmId(null);
    } else {
      setError(result.error || (lang === 'ru' ? 'Не удалось отменить бронь.' : 'Failed to cancel reservation.'));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {bookings.map((item) => {
        const isConfirming = confirmId === item.id;
        const outcome = getCancellationOutcome(item);
        const outcomeNotice =
          lang === 'ru'
            ? getCancellationMessage(outcome)
            : {
                early: 'More than 2 hours before start: no penalty or allowance used.',
                free_monthly: 'Your free monthly cancellation will be used.',
                penalty: 'Your rating will decrease by 2 points.',
                teacher: 'No rating penalty for teachers.',
              }[outcome];

        return (
          <article
            key={item.id}
            className="rounded-xl border border-border bg-card p-4 sm:p-5 transition-all shadow-xs hover:border-primary/30 flex flex-col gap-3"
          >
            {/* Header: Room Name + Code + Status Badge */}
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-foreground">
                      {t.coworking} {item.roomNumber}
                    </h4>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.roomFloor} {t.floorWord}
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              {item.status !== 'active' && <div>
                {item.status === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                    <CheckCircle2 size={13} />
                    {t.completed}
                  </span>
                )}
                {item.status === 'cancelled' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <XCircle size={13} />
                    {t.cancelled}
                  </span>
                )}
              </div>}
            </div>

            {/* Info details grid matching photo 1 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar size={14} className="text-primary shrink-0" />
                <span className="font-medium text-foreground">
                  {formatDate(item.date, false, lang === 'ru' ? 'ru-RU' : 'en-US')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={14} className="text-primary shrink-0" />
                <span className="font-medium text-foreground">
                  {formatTime(item.startTime)} — {formatTime(item.endTime)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Users size={14} className="text-primary shrink-0" />
                <span className="font-medium text-foreground">
                  {item.attendees} / {item.roomCapacity} {t.seats}
                </span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <UserRound size={14} className="text-primary shrink-0" />
                <span className="truncate font-normal text-foreground">{item.userName}</span>
              </div>
            </div>

            {/* Purpose */}
            {item.purpose && (
              <div className="flex items-start gap-2 text-xs pt-1 border-t border-border/40 text-muted-foreground">
                <FileText size={14} className="text-primary shrink-0 mt-0.5" />
                <div className="text-foreground">
                  <span className="font-medium">{t.purpose}:</span>{' '}
                  <span className="font-medium">{t.purposes[item.purpose] || item.purpose}</span>
                </div>
              </div>
            )}

            {/* Active Actions / Confirmation Box */}
            {item.status === 'active' && (
              <div className="pt-2">
                {isConfirming ? (
                  <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold text-xs">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{t.confirmCancel}</span>
                    </div>
                    <p className="text-xs text-rose-600/90 dark:text-rose-400/90 leading-relaxed">
                      {outcomeNotice}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={Boolean(pendingId)}
                        onClick={() => void handleCancel(item.id)}
                        className="rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        {pendingId === item.id ? '…' : lang === 'ru' ? 'Да, отменить' : 'Yes, cancel'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={Boolean(pendingId)}
                        onClick={() => setConfirmId(null)}
                        className="rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        {lang === 'ru' ? 'Назад' : 'Back'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmId(item.id)}
                      className="rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    >
                      {t.cancelBooking}
                      <Trash2 size={13} className="ml-1.5" />
                    </Button>
                    {onSelectRoom && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectRoom(item.roomId)}
                        className="rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        {lang === 'ru' ? 'На схеме этажа' : 'Show on map'}
                        <MapPin size={13} className="ml-1.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
