'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookingList } from '@/components/booking-list';
import { StorageStatus } from '@/components/storage-status';
import { HeaderTopBar } from '@/components/header-topbar';
import { Footer } from '@/components/footer';
import { RatingSummary } from '@/components/rating-summary';
import { AdditionalInfoDialog } from '@/components/additional-info-dialog';
import { MyBookingsDialog } from '@/components/my-bookings-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCampusPreferences } from '@/hooks/use-campus-preferences';
import { useUserBookings } from '@/lib/bookings';
import { useUserProfile } from '@/lib/account';

export default function MyBookingsPage() {
  const { lang, theme, t, toggleLanguage, toggleTheme } = useCampusPreferences();
  const { profile } = useUserProfile();
  const { activeBooking, activeBookings, completedBookings, cancelledBookings, loading, error } = useUserBookings();
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);
  const historyBookings = [...completedBookings, ...cancelledBookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div id="site-root" className="site-shell">
      <HeaderTopBar
        lang={lang}
        theme={theme}
        t={t}
        role={profile.role}
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
          {activeBooking ? (
            <button
              type="button"
              disabled
              className="choose-button disabled:cursor-not-allowed"
              style={{ width: 'auto', padding: '11px 18px' }}
            >
              {lang === 'ru' ? 'Бронь уже есть' : 'Active booking exists'}
            </button>
          ) : (
            <Link href="/" className="choose-button" style={{ width: 'auto', padding: '11px 18px' }}>
              {t.chooseCoworking}
            </Link>
          )}
        </div>

        <div className="my-bookings-tools">
          <RatingSummary compact /><StorageStatus showTemporary />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="floor-tabs-list mb-5">
            <TabsTrigger value="active" className="floor-tab">
              {t.activeBookingTab}
              <span className="floor-count">{activeBookings.length}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="floor-tab">
              {t.historyTab}
              <span className="floor-count">{historyBookings.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active"><BookingList bookings={activeBookings} lang={lang} t={t} />{!loading && !error && !activeBookings.length && <p>{t.noActiveBooking}</p>}</TabsContent>
          <TabsContent value="history"><BookingList bookings={historyBookings} lang={lang} t={t} />{!loading && !error && !historyBookings.length && <p>{t.noHistory}</p>}</TabsContent>
        </Tabs>
        <Footer t={t} />
      </main>
      <MyBookingsDialog open={myBookingsOpen} onOpenChange={setMyBookingsOpen} lang={lang} t={t} />
      <AdditionalInfoDialog open={additionalInfoOpen} onOpenChange={setAdditionalInfoOpen} t={t} />
    </div>
  );
}
