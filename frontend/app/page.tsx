'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DoorOpen,
  Info,
  Layers3,
  LayoutGrid,
  List,
  MapPin,
  Monitor,
  Plug,
  Trash2,
  Users,
  Volume2,
  VolumeX,
  Wifi,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCampusTools } from '@/hooks/use-campus-tools';
import {
  ROOMS,
  FLOOR_NAMES,
  TIME_OPTIONS,
  DEMO_DATE,
  getRoomState,
  getSchedule,
  formatTime,
  formatDate,
  type Room,
} from '@/lib/campus';
import { useUserBookings, evaluateBookingPermission } from '@/lib/bookings';
import { BookingDialog } from '@/components/booking-dialog';
import { Button } from '@/components/ui/button';
import { SiteShell } from '@/components/site-shell';
import { RoomCard } from '@/components/room-card';
import { MyBookingsDialog } from '@/components/my-bookings-dialog';

export default function Home() {
  const [floor, setFloor] = useState(1);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [view, setView] = useState('map');
  const [onlyFree, setOnlyFree] = useState(false);
  const [selectedId, setSelectedId] = useState(
    ROOMS.find(
      (room) =>
        room.floor === 1 &&
        getRoomState(room, DEMO_DATE, 840).status === 'free',
    )!.id,
  );
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [myBookingsOpen, setMyBookingsOpen] = useState(false);

  const hasAvailabilitySelection = date !== null && time !== null;
  const availabilityDate = date ?? DEMO_DATE;
  const availabilityTime = time ?? 840;
  const { activeBooking, cancel, refresh } = useUserBookings(
    availabilityDate,
    availabilityTime,
  );
  const selected = ROOMS.find((room) => room.id === selectedId)!;
  const state = hasAvailabilitySelection
    ? getRoomState(selected, availabilityDate, availabilityTime)
    : null;
  const displayState = state ?? {
    status: 'neutral' as const,
    label: 'Выберите дату и время',
    description: 'Статус коворкинга появится после выбора даты и времени.',
    availableAt: availabilityTime,
  };
  const floorRooms = ROOMS.filter((room) => room.floor === floor);
  const counts = { free: 0, soon: 0, busy: 0 };
  if (hasAvailabilitySelection) {
    ROOMS.forEach(
      (room) =>
        counts[getRoomState(room, availabilityDate, availabilityTime).status]++,
    );
  }

  const isThisRoomBooked = activeBooking?.roomId === selected.id;
  const permission = evaluateBookingPermission(
    selected.id,
    availabilityDate,
    availabilityTime,
  );
  const isOtherRoomBooked =
    !permission.allowed && !isThisRoomBooked && Boolean(activeBooking);

  useCampusTools(
    { floor, date: availabilityDate, time: availabilityTime, selectedId },
    { setFloor, setSelectedId },
  );

  function selectRoom(id: number) {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 970px)').matches) {
      document.getElementById('room-details')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
    }
  }

  function changeFloor(value: unknown) {
    const next = Number(value);
    setFloor(next);
    setSelectedId(
      ROOMS.find(
        (room) =>
          room.floor === next &&
          (!hasAvailabilitySelection ||
            getRoomState(room, availabilityDate, availabilityTime).status ===
              'free'),
      )?.id ?? ROOMS.find((room) => room.floor === next)!.id,
    );
  }

  function renderRoom(room: Room, index: number) {
    const availability = hasAvailabilitySelection
      ? getRoomState(room, availabilityDate, availabilityTime)
      : null;
    return (
      <RoomCard
        key={room.id}
        room={room}
        index={index}
        availability={availability}
        selected={room.id === selectedId}
        dimmed={onlyFree && availability?.status !== 'free'}
        isBookedByMe={activeBooking?.roomId === room.id}
        onSelect={selectRoom}
      />
    );
  }

  return (
    <SiteShell
      onOpenBookings={() => setMyBookingsOpen(true)}
      bookedRoomNumber={activeBooking?.roomNumber}
    >
      <main id="workspace-main" className="workspace">
        <div id="campus-breadcrumb" className="breadcrumb">
          <span>Кампус</span>
          <ChevronRight size={14} />
          <span>Коворкинги</span>
        </div>
        <div id="page-heading-block" className="page-heading">
          <div>
            <h1>Бронирование коворкингов</h1>
            <p className="university-ribbon">
              <span>Место для учёбы и совместной работы</span>
            </p>
          </div>
        </div>

        {/* ACTIVE BOOKING BANNER */}
        {activeBooking && (
          <aside
            id="active-booking-banner"
            className="mb-5 p-3.5 sm:p-4 rounded-xl border border-border bg-accent flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            aria-label="Текущее активное бронирование"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#eaf7ee] text-[#278557] flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-urfu-blue uppercase tracking-wider">
                  Ваша активная бронь
                </div>
                <div className="text-sm font-bold text-foreground">
                  Коворкинг К{activeBooking.roomNumber} (
                  {activeBooking.roomFloor} этаж) ·{' '}
                  {formatDate(activeBooking.date)} с{' '}
                  {formatTime(activeBooking.startTime)} до{' '}
                  {formatTime(activeBooking.endTime)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="banner-show-room-button"
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-white text-foreground hover:bg-accent transition-colors cursor-pointer"
                onClick={() => {
                  changeFloor(activeBooking.roomFloor);
                  selectRoom(activeBooking.roomId);
                }}
              >
                Показать на схеме
              </button>
              <button
                id="banner-manage-booking-button"
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer"
                onClick={() => setMyBookingsOpen(true)}
              >
                Управление бронью
              </button>
            </div>
          </aside>
        )}
        <section className="control-bar" aria-label="Дата и время посещения">
          <label className="date-control">
            <CalendarDays size={19} />
            <span>
              <span className="control-caption">Когда</span>
              <input
                aria-label="Дата посещения"
                type="date"
                value={date ?? ''}
                onChange={(event) => {
                  setDate(event.target.value || null);
                }}
              />
            </span>
          </label>
          <div className="time-control">
            <Clock3 size={19} />
            <span className="control-caption">Ко времени</span>
            <Select
              value={time !== null ? String(time) : 'empty'}
              onValueChange={(value) => {
                setTime(value === 'empty' ? null : Number(value));
              }}
            >
              <SelectTrigger
                className="time-select"
                aria-label="Время посещения"
              >
                <SelectValue>
                  {time === null ? 'Не выбрано' : formatTime(time)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">Не выбрано</SelectItem>
                {TIME_OPTIONS.map((value) => (
                  <SelectItem key={value} value={String(value)}>
                    {formatTime(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="control-spacer" />
          <label htmlFor="only-free-toggle" className="free-filter">
            <Switch
              id="only-free-toggle"
              checked={onlyFree}
              onCheckedChange={setOnlyFree}
              disabled={!hasAvailabilitySelection}
              aria-label="Только свободные коворкинги"
            />
            <span>Только свободные</span>
          </label>
        </section>
        <div className="availability-overview" aria-live="polite">
          {hasAvailabilitySelection ? (
            <>
              <span className="overview-label">Во всём кампусе</span>
              <span className="overview-status free-text">
                <i />
                {counts.free} свободно
              </span>
              <span className="overview-status soon-text">
                <i />
                {counts.soon} скоро заняты
              </span>
              <span className="overview-status busy-text">
                <i />
                {counts.busy} занято
              </span>
              <span className="overview-at">
                на {formatTime(availabilityTime)}
              </span>
            </>
          ) : (
            <span className="availability-prompt">
              Выберите дату и время, чтобы увидеть занятость коворкингов
            </span>
          )}
        </div>

        <div className="main-grid">
          <section className="floor-section" aria-label="Выбор коворкинга">
            <Tabs
              value={String(floor)}
              onValueChange={changeFloor}
              className="floor-tabs"
            >
              <TabsList className="floor-tabs-list" aria-label="Этаж кампуса">
                {[1, 2, 3].map((value) => (
                  <TabsTrigger
                    key={value}
                    value={String(value)}
                    className="floor-tab"
                  >
                    <span>{value} этаж</span>
                    <span className="floor-count">
                      {ROOMS.filter((room) => room.floor === value).length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {[1, 2, 3].map((value) => (
                <TabsContent key={value} value={String(value)}>
                  <div className="floor-card">
                    <div className="floor-card-heading">
                      <div>
                        <h2>{FLOOR_NAMES[value - 1]}</h2>
                        <span>
                          {floorRooms.length} коворкингов · выбери свой
                        </span>
                      </div>
                      <Tabs
                        value={view}
                        onValueChange={(value) => setView(String(value))}
                      >
                        <TabsList
                          className="view-switch"
                          aria-label="Вид коворкингов"
                        >
                          <TabsTrigger value="map" aria-label="Схема этажа">
                            <LayoutGrid size={17} />
                            <span>Схема</span>
                          </TabsTrigger>
                          <TabsTrigger
                            value="list"
                            aria-label="Список коворкингов"
                          >
                            <List size={17} />
                            <span>Список</span>
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                    {view === 'map' ? (
                      <div className="map-scroll">
                        <div className="floor-plan">
                          <div className="plan-edge">
                            <span />
                            <span>Окна во двор</span>
                            <span />
                          </div>
                          <div className="room-row">
                            {floorRooms.slice(0, 4).map(renderRoom)}
                          </div>
                          <div className="corridor">
                            <span className="corridor-stairs">
                              <Layers3 size={20} />
                              <span>Лестница</span>
                            </span>
                            <div className="corridor-line" />
                            <span className="corridor-label">
                              Общий коридор
                            </span>
                            <div className="corridor-line" />
                            <span className="corridor-stairs">
                              <ArrowDown size={19} />
                              <span>Лифт</span>
                            </span>
                          </div>
                          <div className="room-row lower-row">
                            {floorRooms
                              .slice(4)
                              .map((room, index) =>
                                renderRoom(room, index + 4),
                              )}
                            {floorRooms.length === 7 && (
                              <div className="common-space">
                                <DoorOpen size={25} />
                                <span>Зона отдыха</span>
                              </div>
                            )}
                          </div>
                          <div className="plan-bottom">
                            <span>
                              <ArrowDown size={15} /> Вход на этаж
                            </span>
                            <span>План этажа</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="room-list">
                        {floorRooms
                          .filter(
                            (room) =>
                              !onlyFree ||
                              !hasAvailabilitySelection ||
                              getRoomState(
                                room,
                                availabilityDate,
                                availabilityTime,
                              ).status === 'free',
                          )
                          .map((room) => {
                            const current = hasAvailabilitySelection
                              ? getRoomState(
                                  room,
                                  availabilityDate,
                                  availabilityTime,
                                )
                              : null;
                            const isBookedByMe =
                              activeBooking?.roomId === room.id;
                            return (
                              <button
                                id={`list-room-${room.id}`}
                                type="button"
                                key={room.id}
                                className={
                                  'list-room ' +
                                  (room.id === selectedId
                                    ? 'list-room-selected '
                                    : '') +
                                  (isBookedByMe
                                    ? 'border-border bg-accent'
                                    : '')
                                }
                                onClick={() => selectRoom(room.id)}
                                aria-pressed={room.id === selectedId}
                              >
                                <span
                                  className={
                                    'list-room-icon room-' +
                                    (current?.status ?? 'neutral')
                                  }
                                >
                                  <DoorOpen size={21} />
                                </span>
                                <span className="list-room-title">
                                  <span className="flex items-center gap-1.5">
                                    <strong>Коворкинг {room.number}</strong>
                                    {isBookedByMe && (
                                      <span
                                        id={`list-room-badge-${room.id}`}
                                        className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary text-white"
                                      >
                                        Ваша бронь
                                      </span>
                                    )}
                                  </span>
                                  <span>
                                    {room.kind} · {room.capacity} мест
                                  </span>
                                </span>
                                <span
                                  className={
                                    'list-status ' +
                                    (isBookedByMe
                                      ? 'free-text'
                                      : (current?.status ?? 'neutral') +
                                        '-text')
                                  }
                                >
                                  <i />
                                  {isBookedByMe
                                    ? 'Забронировано вами'
                                    : (current?.label ??
                                      'Выберите дату и время')}
                                </span>
                                <ChevronRight size={18} />
                              </button>
                            );
                          })}
                        {onlyFree &&
                          !floorRooms.some(
                            (room) =>
                              getRoomState(
                                room,
                                availabilityDate,
                                availabilityTime,
                              ).status === 'free',
                          ) && (
                            <div className="empty-state">
                              <DoorOpen size={30} />
                              <h3>Сейчас всё занято</h3>
                              <p>Выбери другой этаж или время.</p>
                              <button
                                type="button"
                                onClick={() => setOnlyFree(false)}
                              >
                                Показать все комнаты
                              </button>
                            </div>
                          )}
                      </div>
                    )}
                    {hasAvailabilitySelection && (
                      <div className="map-legend">
                        <span>
                          <i className="legend-free" />
                          Свободно
                        </span>
                        <span>
                          <i className="legend-soon" />
                          Займут в течение 30 мин
                        </span>
                        <span>
                          <i className="legend-busy" />
                          Занято
                        </span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </section>

          <aside
            id="room-details"
            className="details-card"
            aria-label="Выбранный коворкинг"
          >
            <div className="detail-visual">
              <div className="detail-number">{selected.number}</div>
              <div className="detail-visual-bottom">
                <span>
                  <MapPin size={14} />
                  {selected.floor} этаж
                </span>
                <span className="detail-category">{selected.kind}</span>
              </div>
              <span className="detail-visual-icon">
                <DoorOpen size={33} strokeWidth={1.3} />
              </span>
            </div>
            <div className="details-body">
              <div className="detail-eyebrow">ТВОЁ ПРОСТРАНСТВО</div>
              <h2 id="selected-room-title">Коворкинг {selected.number}</h2>
              <p id="selected-room-desc" className="detail-description">
                {selected.description}
              </p>

              {/* SPECIAL NOTICE: ROOM ALREADY BOOKED BY ME */}
              {isThisRoomBooked && activeBooking && (
                <div
                  id="active-room-booked-card"
                  className="p-3.5 mb-3 rounded-xl border border-[#278557]/30 bg-[#eaf7ee] text-xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between font-semibold text-[#278557]">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} />
                      Вы забронировали это место
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#278557] font-bold text-[10px]">
                      Активно
                    </span>
                  </div>
                  <div className="text-[#33503f] leading-relaxed">
                    {formatDate(activeBooking.date)} ·{' '}
                    {formatTime(activeBooking.startTime)} —{' '}
                    {formatTime(activeBooking.endTime)}
                    <br />
                    Цель: <strong>{activeBooking.purpose}</strong>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      id="sidebar-cancel-booking-button"
                      type="button"
                      className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-[#cf414d] text-[#cf414d] hover:bg-[#fdeef0] font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      onClick={() => {
                        cancel(activeBooking.id);
                        refresh();
                      }}
                    >
                      <Trash2 size={13} />
                      Отменить бронь
                    </button>
                    <button
                      id="sidebar-manage-booking-button"
                      type="button"
                      className="py-1.5 px-3 rounded-lg bg-[#278557] text-white hover:bg-[#1f6b46] font-semibold text-xs transition-colors cursor-pointer"
                      onClick={() => setBookingDialogOpen(true)}
                    >
                      Детали
                    </button>
                  </div>
                </div>
              )}

              {/* SPECIAL NOTICE: ANOTHER ROOM BOOKED BY ME */}
              {isOtherRoomBooked && activeBooking && (
                <div
                  id="other-room-booked-notice"
                  className="p-3 mb-3 rounded-xl border border-[#f5ccd2] bg-[#fdeef0] text-xs text-[#8f323c] flex flex-col gap-1.5"
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <Info size={14} />
                    Правило кампуса: 1 бронь на человека
                  </div>
                  <div className="leading-relaxed">
                    У вас уже забронирован коворкинг{' '}
                    <strong>К{activeBooking.roomNumber}</strong> (
                    {activeBooking.roomFloor} этаж). Чтобы забронировать это
                    помещение, сначала отмените текущую бронь.
                  </div>
                </div>
              )}

              <div
                id="selected-room-availability-box"
                className={
                  'availability-box availability-' + displayState.status
                }
              >
                <span className="availability-icon">
                  {displayState.status === 'busy' ? (
                    <Clock3 size={19} />
                  ) : (
                    <CheckCheck size={19} />
                  )}
                </span>
                <div>
                  <strong>{displayState.label}</strong>
                  <span>{displayState.description}</span>
                </div>
              </div>
              <div id="room-amenities-list" className="amenities">
                <span>
                  <Users size={17} />
                  {selected.capacity} мест
                </span>
                <span>
                  <Wifi size={17} />
                  Wi-Fi
                </span>
                <span>
                  <Plug size={17} />
                  Розетки
                </span>
                <span>
                  {selected.quiet ? (
                    <VolumeX size={17} />
                  ) : (
                    <Volume2 size={17} />
                  )}{' '}
                  {selected.quiet ? 'Тихая зона' : 'Можно общаться'}
                </span>
                {selected.monitor && (
                  <span>
                    <Monitor size={17} />
                    Экран
                  </span>
                )}
              </div>
              <>
                <div className="schedule-heading">
                  <h3>Расписание на день</h3>
                  <span>{formatDate(availabilityDate, true)}</span>
                </div>
                <div
                  id="room-timeline-bar"
                  className="timeline"
                  aria-label="Занятость с 8 до 22 часов"
                >
                  {getSchedule(selected, availabilityDate).map(
                    (booking, index) => (
                      <span
                        key={index}
                        className="timeline-booking"
                        style={{
                          left: ((booking.start - 480) / 840) * 100 + '%',
                          width:
                            ((booking.end - booking.start) / 840) * 100 + '%',
                        }}
                        title={
                          'Занято ' +
                          formatTime(booking.start) +
                          '–' +
                          formatTime(booking.end)
                        }
                      />
                    ),
                  )}
                  {hasAvailabilitySelection && (
                    <span
                      className="timeline-marker"
                      style={{
                        left: ((availabilityTime - 480) / 840) * 100 + '%',
                      }}
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
                  {getSchedule(selected, availabilityDate)
                    .filter(
                      (booking) =>
                        !hasAvailabilitySelection ||
                        booking.end > availabilityTime,
                    )
                    .slice(0, 3)
                    .map((booking, index) => (
                      <div key={index}>
                        <span>
                          <span className="schedule-dot" />
                          {formatTime(booking.start)} —{' '}
                          {formatTime(booking.end)}
                        </span>
                        <span>Занято</span>
                      </div>
                    ))}
                  {!getSchedule(selected, availabilityDate).some(
                    (booking) =>
                      !hasAvailabilitySelection ||
                      booking.end > availabilityTime,
                  ) && (
                    <div>
                      <span className="free-text">Свободно до закрытия</span>
                      <span>22:00</span>
                    </div>
                  )}
                </div>
              </>

              {/* PRIMARY ACTION BUTTON */}
              <Button
                id="choose-coworking-button"
                type="button"
                className="choose-button cursor-pointer"
                disabled={!isThisRoomBooked && displayState.status === 'busy'}
                onClick={() => setBookingDialogOpen(true)}
              >
                {isThisRoomBooked
                  ? 'Управление бронью этого места'
                  : displayState.status === 'busy'
                    ? 'Свободно с ' + formatTime(displayState.availableAt)
                    : 'Забронировать'}
                {displayState.status !== 'busy' && <ArrowRight size={18} />}
              </Button>
            </div>
          </aside>
        </div>
      </main>

      {/* MODAL: BOOKING WORKFLOW */}
      <BookingDialog
        key={`${selected.id}-${date ?? 'none'}-${time ?? 'none'}`}
        room={selected}
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        selectedDate={date}
        selectedTime={time}
        onOpenMyBookings={() => setMyBookingsOpen(true)}
      />

      {/* MODAL: MY BOOKINGS LIST */}
      <MyBookingsDialog
        open={myBookingsOpen}
        onOpenChange={setMyBookingsOpen}
        onSelectRoom={(roomId) => {
          const target = ROOMS.find((r) => r.id === roomId);
          if (target) {
            setFloor(target.floor);
            selectRoom(target.id);
          }
        }}
      />
    </SiteShell>
  );
}
