'use client';

import { useState } from 'react';
import { useCampusTools } from '@/hooks/use-campus-tools';
import { useCampusPreferences } from '@/hooks/use-campus-preferences';
import { getToday, ROOMS, getRoomAvailability, type Room } from '@/lib/campus';
import { useUserBookings, evaluateBookingPermission } from '@/lib/bookings';
import { StorageStatus } from '@/components/storage-status';
import { useUserProfile } from '@/lib/account';
import { HeaderTopBar } from '@/components/header-topbar';
import { ControlBar } from '@/components/control-bar';
import { FloorPlanView } from '@/components/floor-plan-view';
import { RoomDetailsSidebar } from '@/components/room-details-sidebar';
import { Footer } from '@/components/footer';
import { BookingDialog } from '@/components/booking-dialog';
import { MyBookingsDialog } from '@/components/my-bookings-dialog';
import { AdditionalInfoDialog } from '@/components/additional-info-dialog';

export default function Home() {
  const { lang, theme, t, toggleLanguage, toggleTheme } = useCampusPreferences();
  const { profile } = useUserProfile();
  const [floor, setFloor] = useState(1);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState(ROOMS.find((room) => room.floor === 1)!.id);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(false);

  const referenceDate = date || getToday();
  const referenceTime = time ?? 840;
  const { activeBooking, cancel } = useUserBookings(referenceDate, referenceTime);
  const selected: Room = ROOMS.find((room) => room.id === selectedId)!;
  const state = getRoomAvailability(selected, date, time);
  const permission = evaluateBookingPermission(selected.id, date, time);
  const isThisRoomBooked = permission.isSameRoomBooked;
  const isOtherRoomBooked = Boolean(permission.activeBooking && !isThisRoomBooked);

  useCampusTools({ floor, date, time: referenceTime, selectedId }, { setFloor, setSelectedId });

  function selectRoom(id: number) {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 970px)').matches) {
      document.getElementById('room-details')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      });
    }
  }

  function changeFloor(next: number) {
    setFloor(next);
    setSelectedId(ROOMS.find((room) => room.floor === next)!.id);
  }

  const [cancelError, setCancelError] = useState('');
  async function handleCancelBooking(bookingId: string) {
    const result = await cancel(bookingId);
    setCancelError(result.success ? '' : result.error || 'Не удалось отменить бронь.');
  }

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
        onOpenUser={() => setMyBookingsOpen(true)}
        onOpenMyBookings={() => setMyBookingsOpen(true)}
        onOpenAdditionalInfo={() => setAdditionalInfoOpen(true)}
      />

      <main id="workspace-main" className="workspace">
        <StorageStatus />
        {cancelError && <p role="alert" className="text-red-600">{cancelError}</p>}
        <div id="page-heading-block" className="page-heading">
          <div>
            <h1>{t.heading}</h1>
            <p>{t.subheading}</p>
          </div>
        </div>

        <ControlBar
          date={date}
          time={time}
          t={t}
          lang={lang}
          onDateChange={setDate}
          onTimeChange={setTime}
        />

        <div className="main-grid">
          <FloorPlanView
            floor={floor}
            rooms={ROOMS}
            selectedId={selectedId}
            date={date}
            time={time}
            activeBookingRoomId={activeBooking?.roomId}
            t={t}
            lang={lang}
            onFloorChange={changeFloor}
            onSelectRoom={selectRoom}
          />
          <RoomDetailsSidebar
            room={selected}
            state={state}
            date={date}
            time={time}
            activeBooking={permission.activeBooking}
            isThisRoomBooked={isThisRoomBooked}
            isOtherRoomBooked={isOtherRoomBooked}
            t={t}
            lang={lang}
            onOpenBookingDialog={() => setBookingDialogOpen(true)}
            onCancelBooking={handleCancelBooking}
          />
        </div>

        <Footer t={t} />
      </main>

      <BookingDialog
        key={`${selected.id}-${date}-${time ?? 'none'}-${bookingDialogOpen ? 'open' : 'closed'}`}
        room={selected}
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        selectedDate={date || undefined}
        selectedTime={time}
        lang={lang}
        t={t}
        onOpenMyBookings={() => setMyBookingsOpen(true)}
      />
      <MyBookingsDialog
        open={myBookingsOpen}
        onOpenChange={setMyBookingsOpen}
        lang={lang}
        t={t}
        onSelectRoom={(roomId) => {
          const target = ROOMS.find((room) => room.id === roomId);
          if (target) {
            setFloor(target.floor);
            selectRoom(target.id);
          }
        }}
      />
      <AdditionalInfoDialog
        open={additionalInfoOpen}
        onOpenChange={setAdditionalInfoOpen}
        t={t}
      />
    </div>
  );
}
