import { ArrowRight, CheckCircle2 } from 'lucide-react';
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
import type { Translation, Language } from '@/lib/translations';

interface RoomDetailsSidebarProps {
  room: Room;
  state: RoomState;
  date: string;
  time: number | null;
  isThisRoomBooked: boolean;
  isOtherRoomBooked: boolean;
  t: Translation;
  lang: Language;
  onOpenBookingDialog: () => void;
}

function getBookingLoadColor(attendees: number) {
  if (attendees >= 8) {
    return { background: '#df4f5c', borderColor: '#c83d4b', dot: '#c83d4b' };
  }
  if (attendees >= 6) {
    return { background: '#ef9a54', borderColor: '#dc813d', dot: '#dc813d' };
  }
  return { background: '#f3d35f', borderColor: '#dbb83d', dot: '#c69f24' };
}

export function RoomDetailsSidebar({
  room,
  state: _state,
  date,
  time,
  isThisRoomBooked,
  isOtherRoomBooked,
  t,
  lang,
  onOpenBookingDialog,
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
            (() => {
              const color = getBookingLoadColor(booking.attendees);
              return (
                <span
                  key={index}
                  className="timeline-booking"
                  style={{
                    left: ((booking.start - 480) / 840) * 100 + '%',
                    width: ((booking.end - booking.start) / 840) * 100 + '%',
                    background: color.background,
                    borderColor: color.borderColor,
                  }}
                  title={
                    `${t.busy} ` +
                    formatTime(booking.start) +
                    '–' +
                    formatTime(booking.end) +
                    ` · ${booking.attendees}/${room.capacity}`
                  }
                />
              );
            })()
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
                  <span className="schedule-dot" style={{ background: getBookingLoadColor(booking.attendees).dot }} />
                  {formatTime(booking.start)} — {formatTime(booking.end)}
                </span>
                <span>
                  {lang === 'ru'
                    ? `${t.busy}: ${booking.attendees}/${room.capacity}`
                    : `${booking.attendees}/${room.capacity} occupied`}
                </span>
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
          className="choose-button cursor-pointer disabled:cursor-not-allowed"
          onClick={onOpenBookingDialog}
          disabled={isOtherRoomBooked}
          title={isOtherRoomBooked ? (lang === 'ru' ? 'Сначала отмените текущую бронь' : 'Cancel your current reservation first') : undefined}
        >
          {isThisRoomBooked
            ? t.manageThisBooking
            : isOtherRoomBooked
            ? lang === 'ru' ? 'Бронь уже есть' : 'Active booking exists'
            : t.chooseCoworking}
          {isOtherRoomBooked ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
        </button>
      </div>
    </aside>
  );
}
