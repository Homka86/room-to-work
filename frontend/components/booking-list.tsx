'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from '@/lib/campus';
import { useUserBookings, getCancellationMessage, getCancellationOutcome, type UserBooking } from '@/lib/bookings';
import type { Language, Translation } from '@/lib/translations';

export function BookingList({ bookings, lang, t, onSelectRoom }: { bookings: UserBooking[]; lang: Language; t: Translation; onSelectRoom?: (id: number) => void }) {
  const { cancel } = useUserBookings();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  async function cancelBooking(id: string) {
    if (pending) return;
    setPending(id); setError('');
    const result = await cancel(id);
    setPending(null);
    if (result.success) setConfirm(null);
    else setError(result.error || 'Не удалось отменить бронь.');
  }
  return <div className="grid gap-3">
    {error && <p role="alert" className="text-red-600 text-sm">{error}</p>}
    {bookings.map(item => <article key={item.id} className="rounded-xl border border-border bg-card p-4">
      <div className="flex justify-between items-start gap-3"><strong>{t.coworking} {item.roomNumber}</strong><span className="text-xs text-muted-foreground">{item.status === 'active' ? t.active : item.status === 'completed' ? t.completed : t.cancelled}</span></div>
      <p className="text-sm my-2">{formatDate(item.date, false, lang === 'ru' ? 'ru-RU' : 'en-US')} · {formatTime(item.startTime)} — {formatTime(item.endTime)}</p>
      <p className="text-xs text-muted-foreground">{item.roomFloor} {t.floorWord} · {item.attendees} / {item.roomCapacity} {t.seats} · {item.userName}</p>
      <p className="text-sm my-2">{t.purpose}: {item.purpose}</p>
      {item.status === 'active' && (confirm === item.id ? <div className="rounded-lg bg-muted p-3">
        <p className="text-sm mb-2">{t.confirmCancel}</p>
        <p className="text-xs mb-3">{lang === 'ru' ? getCancellationMessage(getCancellationOutcome(item)) : ({early: 'More than 2 hours before the start: no penalty or allowance used.', free_monthly: 'Your free monthly cancellation will be used.', penalty: 'Your rating will decrease by 2 points.', teacher: 'No rating penalty.'}[getCancellationOutcome(item)])}</p>
        <div className="flex gap-2"><Button variant="destructive" disabled={Boolean(pending)} onClick={() => void cancelBooking(item.id)}>{pending === item.id ? '…' : lang === 'ru' ? 'Да, отменить' : 'Yes, cancel'}</Button><Button variant="outline" disabled={Boolean(pending)} onClick={() => setConfirm(null)}>{lang === 'ru' ? 'Назад' : 'Back'}</Button></div>
      </div> : <div className="flex flex-wrap gap-2 mt-3"><Button variant="outline" onClick={() => setConfirm(item.id)}>{t.cancelBooking}</Button>{onSelectRoom && <Button variant="outline" onClick={() => onSelectRoom(item.roomId)}>{lang === 'ru' ? 'На схеме этажа' : 'Show on map'}</Button>}</div>)}
    </article>)}
  </div>;
}
