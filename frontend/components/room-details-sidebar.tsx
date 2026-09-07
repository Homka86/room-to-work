import { ArrowRight, CheckCircle2, Info, Trash2 } from 'lucide-react';
import { RoomPhotoGallery } from './room-photo-gallery';
import { RoomAmenities } from './room-amenities';
import {
  getToday,
  getSchedule,
  isScheduleLoaded,
  formatDate,
  formatTime,
  type Room,
  type RoomState,
} from '@/lib/campus';
import type { UserBooking } from '@/lib/bookings';
import type { Translation, Language } from '@/lib/translations';

interface RoomDetailsSidebarProps {
  room: Room;
  state: RoomState;
  date: string;
  time: number | null;
  activeBooking?: UserBooking | null;
  isThisRoomBooked: boolean;
  isOtherRoomBooked: boolean;
  t: Translation;
  lang: Language;
  onOpenBookingDialog: () => void;
  onCancelBooking: (bookingId: string) => void;
}

export function RoomDetailsSidebar({
  room,
  state,
  date,
  time,
  activeBooking,
  isThisRoomBooked,
  isOtherRoomBooked,
  t,
  lang,
  onOpenBookingDialog,
  onCancelBooking,
}: RoomDetailsSidebarProps) {
  const availabilityDate = date || getToday();
  const schedule = getSchedule(room, availabilityDate);
  const scheduleLoaded = isScheduleLoaded(availabilityDate);

  return (
    <aside
      id="room-details"
      className="details-card"
      aria-label={lang === 'ru' ? 'Выбранный коворкинг' : 'Selected coworking'}
    >
      {/* PHOTO GALLERY CAROUSEL */}
      <RoomPhotoGallery
        roomId={room.id}
        roomKind={room.kind}
        floor={room.floor}
        roomNumber={room.number}
        lang={lang}
      />

      <div className="details-body">
        <h2 id="selected-room-title">
          {t.coworking} {room.number}
        </h2>
        <div className="detail-kind">
          {t.kinds[room.kind as keyof typeof t.kinds] || room.kind}
        </div>

        {date && time !== null && (
          <div className={`availability-box availability-${state.status} mb-4`}>
            <span className="availability-icon">
              <CheckCircle2 size={18} />
            </span>
            <div>
              <strong>{state.label}</strong>
              <span>{state.description}</span>
            </div>
          </div>
        )}

        {/* SPECIAL NOTICE: ROOM ALREADY BOOKED BY ME */}
        {isThisRoomBooked && activeBooking && (
          <div
            id="active-room-booked-card"
            className="p-3.5 mb-4 rounded-xl border border-[#278557]/30 bg-[#eaf7ee] dark:bg-[#153422] text-xs flex flex-col gap-2"
          >
            <div className="flex items-center justify-between font-semibold text-[#278557] dark:text-[#52d98c]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                {t.youBookedThis}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white dark:bg-[#1f472e] text-[#278557] dark:text-[#52d98c] font-bold text-[10px]">
                {t.active}
              </span>
            </div>
            <div className="text-[#33503f] dark:text-[#c4ecd5] leading-relaxed">
              {formatDate(activeBooking.date)} · {formatTime(activeBooking.startTime)} — {formatTime(activeBooking.endTime)}
              <br />
              {t.purpose}: <strong>{activeBooking.purpose}</strong>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                id="sidebar-cancel-booking-button"
                type="button"
                className="flex-1 py-1.5 px-2 rounded-lg bg-card border border-[#cf414d] text-[#cf414d] hover:bg-[#fdeef0] dark:hover:bg-[#341b22] font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                onClick={() => onCancelBooking(activeBooking.id)}
              >
                <Trash2 size={13} />
                {t.cancelBooking}
              </button>
              <button
                id="sidebar-manage-booking-button"
                type="button"
                className="py-1.5 px-3 rounded-lg bg-[#278557] text-white hover:bg-[#1f6b46] font-semibold text-xs transition-colors cursor-pointer"
                onClick={onOpenBookingDialog}
              >
                {t.details}
              </button>
            </div>
          </div>
        )}

        {/* SPECIAL NOTICE: ANOTHER ROOM BOOKED BY ME */}
        {isOtherRoomBooked && activeBooking && (
          <div
            id="other-room-booked-notice"
            className="p-3 mb-4 rounded-xl border border-[#f5ccd2] dark:border-[#522934] bg-[#fdeef0] dark:bg-[#2b181e] text-xs text-[#8f323c] dark:text-[#f3a8b4] flex flex-col gap-1.5"
          >
            <div className="font-semibold flex items-center gap-1.5">
              <Info size={14} />
              {t.campusRuleNotice}
            </div>
            <div className="leading-relaxed">
              {lang === 'ru'
                ? `У вас уже забронирован коворкинг ${activeBooking.roomNumber} (${activeBooking.roomFloor} этаж). Чтобы забронировать это помещение, сначала отмените текущую бронь.`
                : `You already have an active reservation for Coworking ${activeBooking.roomNumber} (Floor ${activeBooking.roomFloor}). Please cancel it first to reserve this workspace.`}
            </div>
          </div>
        )}

        {/* AMENITIES */}
        <RoomAmenities
          capacity={room.capacity}
          quiet={room.quiet}
          monitor={room.monitor}
          t={t}
        />

        {/* SCHEDULE */}
        <div className="schedule-heading">
          <h3>{t.dailySchedule}</h3>
          <span>{formatDate(availabilityDate, true, lang === 'ru' ? 'ru-RU' : 'en-US')}</span>
        </div>

        <div id="room-timeline-bar" className="timeline" style={!scheduleLoaded ? { background: "var(--muted)" } : undefined} aria-label="Занятость с 8 до 22 часов">
          {schedule.map((booking, index) => (
            <span
              key={index}
              className="timeline-booking"
              style={{
                left: ((booking.start - 480) / 840) * 100 + '%',
                width: ((booking.end - booking.start) / 840) * 100 + '%',
              }}
              title={
                `${t.busy} ` +
                formatTime(booking.start) +
                '–' +
                formatTime(booking.end)
              }
            />
          ))}
          {time !== null && (
            <span
              className="timeline-marker"
              style={{ left: ((time - 480) / 840) * 100 + '%' }}
            />
          )}
        </div>

        <div className="timeline-labels">
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>22:00</span>
        </div>

        <div id="room-schedule-list" className="schedule-list">
          {!scheduleLoaded && <output>{lang === 'ru' ? 'Расписание пока недоступно' : 'Schedule unavailable'}</output>}
          {schedule
            .map((booking, index) => (
              <div key={index}>
                <span>
                  <span className="schedule-dot" />
                  {formatTime(booking.start)} — {formatTime(booking.end)}
                </span>
                <span>{t.busy}</span>
              </div>
            ))}
          {scheduleLoaded && !schedule.length && (
            <div>
              <span className="free-text">{t.freeUntilClosing}</span>
              <span>22:00</span>
            </div>
          )}
        </div>

        {/* PRIMARY ACTION BUTTON */}
        <button
          id="choose-coworking-button"
          type="button"
          className="choose-button cursor-pointer"
          onClick={onOpenBookingDialog}
        >
          {isThisRoomBooked
            ? t.manageThisBooking
            : t.chooseCoworking}
          <ArrowRight size={18} />
        </button>
      </div>
    </aside>
  );
}
