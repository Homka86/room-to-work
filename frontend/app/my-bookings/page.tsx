'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, DoorOpen, History, Trash2, Users } from 'lucide-react';
import { HeaderTopBar } from '@/components/header-topbar';
import { Footer } from '@/components/footer';
import { RatingSummary } from '@/components/rating-summary';
import { AdditionalInfoDialog } from '@/components/additional-info-dialog';
import { MyBookingsDialog } from '@/components/my-bookings-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCampusPreferences } from '@/hooks/use-campus-preferences';
import { formatDate, formatTime } from '@/lib/campus';
import { useUserBookings } from '@/lib/bookings';
import { useUserProfile } from '@/lib/account';

export default function MyBookingsPage() {
  const { lang, theme, t, toggleLanguage, toggleTheme } = useCampusPreferences();
  const { profile, setRole } = useUserProfile();
  const { activeBooking, completedBookings, cancelledBookings, cancel, refresh } = useUserBookings();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);
  const historyBookings = [...completedBookings, ...cancelledBookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function handleCancel() {
    if (!activeBooking) return;
    cancel(activeBooking.id);
    setConfirmCancel(false);
    refresh();
  }

  return (
    <div id="site-root" className="site-shell">
      <HeaderTopBar
        lang={lang}
        theme={theme}
        t={t}
        role={profile.role}
        onRoleChange={setRole}
        activeBooking={activeBooking}
        onToggleLanguage={toggleLanguage}
        onToggleTheme={toggleTheme}
        onOpenMyBookings={() => setMyBookingsOpen(true)}
        onOpenAdditionalInfo={() => setAdditionalInfoOpen(true)}
      />
      <main className="workspace">
        <div className="page-heading">
          <div>
            <h1>{t.myBookings}</h1>
            <p>{lang === 'ru' ? 'Текущие и завершённые бронирования.' : 'Current and completed reservations.'}</p>
          </div>
          <Link href="/" className="choose-button" style={{ width: 'auto', padding: '11px 18px' }}>
            {t.chooseCoworking}
          </Link>
        </div>

        <div className="my-bookings-tools">
          <RatingSummary compact />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="floor-tabs-list mb-5">
            <TabsTrigger value="active" className="floor-tab">
              {t.activeBookingTab}
              <span className="floor-count">{activeBooking ? 1 : 0}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="floor-tab">
              {t.historyTab}
              <span className="floor-count">{historyBookings.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeBooking ? (
              <section className="floor-card" style={{ padding: 24 }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="detail-kind">{activeBooking.roomFloor} {t.floorWord}</div>
                    <h2 style={{ margin: 0 }}>{t.coworking} {activeBooking.roomNumber}</h2>
                  </div>
                  <span className="availability-box availability-free" style={{ padding: '8px 11px' }}>{t.active}</span>
                </div>
                <div className="amenities" style={{ marginBottom: 18 }}>
                  <span><Calendar size={17} />{formatDate(activeBooking.date, false, lang === 'ru' ? 'ru-RU' : 'en-US')}</span>
                  <span><Clock size={17} />{formatTime(activeBooking.startTime)} — {formatTime(activeBooking.endTime)}</span>
                  <span><Users size={17} />{activeBooking.attendees} / {activeBooking.roomCapacity} {t.seats}</span>
                  <span><DoorOpen size={17} />{activeBooking.userName}</span>
                </div>
                <p className="muted" style={{ margin: '0 0 18px' }}>{t.purpose}: {activeBooking.purpose}</p>
                {confirmCancel ? (
                  <div className="availability-box availability-busy" style={{ justifyContent: 'space-between', gap: 12 }}>
                    <span>{t.confirmCancel}</span>
                    <div className="flex gap-2">
                      <button type="button" className="choose-button" style={{ width: 'auto', padding: '9px 14px', background: 'var(--busy)' }} onClick={handleCancel}>{lang === 'ru' ? 'Да, отменить' : 'Yes, cancel'}</button>
                      <button type="button" className="choose-button" style={{ width: 'auto', padding: '9px 14px', background: 'var(--muted)', color: 'var(--foreground)' }} onClick={() => setConfirmCancel(false)}>{lang === 'ru' ? 'Назад' : 'Back'}</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="choose-button" style={{ background: 'var(--busy)' }} onClick={() => setConfirmCancel(true)}><Trash2 size={17} />{t.cancelBooking}</button>
                )}
              </section>
            ) : (
              <div className="empty-state"><DoorOpen size={38} /><h3>{t.noActiveBooking}</h3><p>{t.noActiveBookingHint}</p><Link href="/" className="choose-button" style={{ width: 'auto' }}>{t.chooseCoworking}</Link></div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {historyBookings.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyBookings.map((item) => (
                  <article key={item.id} className="floor-card" style={{ padding: 18 }}>
                    <div className="flex justify-between gap-3"><strong>{t.coworking} {item.roomNumber}</strong><span className="muted">{item.status === 'completed' ? t.completed : t.cancelled}</span></div>
                    <p className="muted" style={{ margin: '8px 0 0' }}>{formatDate(item.date, false, lang === 'ru' ? 'ru-RU' : 'en-US')} · {formatTime(item.startTime)} — {formatTime(item.endTime)}</p>
                    <p className="muted" style={{ margin: '8px 0 0' }}>{t.purpose}: {item.purpose}</p>
                  </article>
                ))}
              </div>
            ) : <div className="empty-state"><History size={34} /><p>{t.noHistory}</p></div>}
          </TabsContent>
        </Tabs>
        <Footer t={t} />
      </main>
      <MyBookingsDialog open={myBookingsOpen} onOpenChange={setMyBookingsOpen} lang={lang} t={t} />
      <AdditionalInfoDialog open={additionalInfoOpen} onOpenChange={setAdditionalInfoOpen} t={t} />
    </div>
  );
}
