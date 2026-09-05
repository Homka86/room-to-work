'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DoorOpen,
  GraduationCap,
  Info,
  Layers3,
  LayoutGrid,
  List,
  MapPin,
  Monitor,
  Plug,
  ShieldAlert,
  Star,
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
import { MyBookingsDialog } from '@/components/my-bookings-dialog';
import {
  formatRating,
  getFreeCancellationsLeft,
  getStoredProfile,
  isStudentBlocked,
  useUserProfile,
} from '@/lib/account';

export default function Home() {
  const [floor, setFloor] = useState(1);
  const [date, setDate] = useState(DEMO_DATE);
  const [time, setTime] = useState(840);
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

  const { setRole } = useUserProfile();
  const profile = getStoredProfile();
  const isRatingBlocked = isStudentBlocked(profile);
  const freeCancellationsLeft = getFreeCancellationsLeft(profile);
  const { activeBooking, cancel, refresh } = useUserBookings(date, time);
  const selected = ROOMS.find((room) => room.id === selectedId)!;
  const state = getRoomState(selected, date, time);
  const floorRooms = ROOMS.filter((room) => room.floor === floor);
  const counts = { free: 0, soon: 0, busy: 0 };
  ROOMS.forEach((room) => counts[getRoomState(room, date, time).status]++);

  const isThisRoomBooked = activeBooking?.roomId === selected.id;
  const permission = evaluateBookingPermission(selected.id, date, time);
  const isOtherRoomBooked =
    !permission.allowed && !isThisRoomBooked && Boolean(activeBooking);

  useCampusTools(
    { floor, date, time, selectedId },
    { setFloor, setSelectedId },
  );

  function selectRoom(id: number) {
    setSelectedId(id);
    if (window.matchMedia('(max-width: 970px)').matches) {
      document
        .getElementById('room-details')
        ?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
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
          getRoomState(room, date, time).status === 'free',
      )?.id ?? ROOMS.find((room) => room.floor === next)!.id,
    );
  }

  function renderRoom(room: Room, index: number) {
    const availability = getRoomState(room, date, time);
    const dimmed = onlyFree && availability.status !== 'free';
    const isBookedByMe = activeBooking?.roomId === room.id;

    return (
      <button
        id={`room-card-${room.id}`}
        type="button"
        key={room.id}
        className={
          'room room-' +
          availability.status +
          (room.id === selectedId ? ' room-selected' : '') +
          (dimmed ? ' room-dimmed' : '') +
          (isBookedByMe ? ' ring-2 ring-[#7560da] ring-offset-2' : '')
        }
        onClick={() => selectRoom(room.id)}
        disabled={dimmed}
        aria-pressed={room.id === selectedId}
        aria-label={
          'Коворкинг ' +
          room.number +
          ', ' +
          availability.label +
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
              className="px-1.5 py-0.5 rounded bg-[#7560da] text-white text-[10px] font-bold flex items-center gap-0.5"
              title="Ваша активная бронь"
            >
              <Bookmark size={11} />
              Вы
            </span>
          ) : room.id === selectedId ? (
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
          {isBookedByMe ? 'Ваша бронь' : availability.shortLabel}
        </span>
      </button>
    );
  }

  return (
    <div id="site-root" className="site-shell">
      <header id="site-topbar" className="topbar">
        <Link id="brand-logo-link" href="/" className="brand" aria-label="Есть место — главная">
          <span className="brand-icon">
            <DoorOpen size={24} strokeWidth={2.4} />
          </span>
          <span>
            есть место<span className="brand-dot">.</span>
          </span>
        </Link>
        <div id="campus-location-info" className="header-location">
          <Building2 size={17} />
          <span>Университетский кампус</span>
          <span className="header-separator" />
          <span className="muted">3 этажа · 23 коворкинга</span>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] text-[#858a9c]">Роль</span>
            <Select
              value={profile.role}
              onValueChange={(value) => {
                if (value === 'student' || value === 'teacher') setRole(value);
              }}
            >
              <SelectTrigger
                id="header-role-select"
                className="h-8 min-w-[126px] border-[#dfd6f2] bg-[#fbf9fe] text-xs font-semibold text-[#7560da]"
                aria-label="Роль пользователя"
              >
                <SelectValue>
                  {profile.role === 'student' ? 'Ученик' : 'Преподаватель'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Ученик</SelectItem>
                <SelectItem value="teacher">Преподаватель</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            id="header-my-bookings-button"
            type="button"
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#dfd6f2] bg-[#fbf9fe] text-[#7560da] hover:bg-[#f3edf9] transition-all cursor-pointer"
            onClick={() => setMyBookingsOpen(true)}
            aria-label="Мои бронирования"
          >
            <Bookmark size={15} />
            <span>Мои бронирования</span>
            {activeBooking ? (
              <span
                id="header-active-booking-pill"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#eaf7ee] text-[#278557] text-[11px] font-bold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#278557]" />
                К{activeBooking.roomNumber}
              </span>
            ) : (
              <span
                id="header-no-booking-counter"
                className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#ede9f9] text-[#7560da]"
              >
                0
              </span>
            )}
          </button>
          <span id="demo-pill-badge" className="demo-pill !ml-0">
            <span />
            Демо-версия
          </span>
        </div>
      </header>
      <main id="workspace-main" className="workspace">
        <div id="campus-breadcrumb" className="breadcrumb">
          <span>Кампус</span>
          <ChevronRight size={14} />
          <span>Коворкинги</span>
        </div>
        <div id="page-heading-block" className="page-heading">
          <div>
            <h1>Место для твоих идей</h1>
            <p>Найди свободный коворкинг на нужном этаже.</p>
          </div>
          <div id="campus-stamp-block" className="campus-stamp">
            <Layers3 size={21} />
            <span>
              Один кампус.
              <br />
              <strong>23 возможности.</strong>
            </span>
          </div>
        </div>

        <section
          id="rating-policy-card"
          className={`mb-5 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isRatingBlocked
              ? 'border-[#f5ccd2] bg-[#fff6f7]'
              : 'border-[#e4def2] bg-[#fbf9fe]'
          }`}
          aria-label="Рейтинг и роль пользователя"
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                isRatingBlocked
                  ? 'bg-[#fdeef0] text-[#b94a57]'
                  : 'bg-[#ede9fc] text-[#7560da]'
              }`}
            >
              {isRatingBlocked ? (
                <ShieldAlert size={20} />
              ) : profile.role === 'student' ? (
                <Star size={20} />
              ) : (
                <GraduationCap size={20} />
              )}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#7560da]">
                {profile.role === 'student'
                  ? 'Рейтинг ученика'
                  : 'Профиль преподавателя'}
              </div>
              <div className="text-sm font-semibold text-[#2a2d3c] mt-0.5">
                {isRatingBlocked
                  ? `Бронирование заблокировано до ${formatDate(profile.blockedUntil!)}`
                  : profile.role === 'student'
                  ? 'Рейтинг влияет на доступ к бронированиям'
                  : 'Рейтинг не начисляется и не ограничивает бронирование'}
              </div>
              <div className="text-xs text-[#858a9c] mt-1">
                {profile.role === 'student'
                  ? `+1 за завершённую бронь · ${freeCancellationsLeft > 0 ? '1 бесплатная отмена в месяц' : 'бесплатная отмена в этом месяце уже использована'} · отмена более чем за 2 часа без штрафа · блокировка при −3 на 30 дней`
                  : 'Для преподавателей доступны те же комнаты без рейтинговых ограничений'}
              </div>
              <div className="text-xs text-[#858a9c] mt-1">
                Ограничение бронирования: один аккаунт — один активный коворкинг · один коворкинг — один ответственный.
              </div>
              <div className="sm:hidden flex items-center gap-2 mt-3">
                <span className="text-xs font-medium text-[#6c647e]">Роль:</span>
                <Select
                  value={profile.role}
                  onValueChange={(value) => {
                    if (value === 'student' || value === 'teacher') setRole(value);
                  }}
                >
                  <SelectTrigger
                    id="mobile-role-select"
                    className="h-8 min-w-[140px] border-[#dfd6f2] bg-white text-xs font-semibold text-[#7560da]"
                    aria-label="Роль пользователя"
                  >
                    <SelectValue>
                      {profile.role === 'student' ? 'Ученик' : 'Преподаватель'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Ученик</SelectItem>
                    <SelectItem value="teacher">Преподаватель</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div
            className={`shrink-0 self-start sm:self-center rounded-xl px-4 py-2 text-center ${
              isRatingBlocked
                ? 'bg-[#fdeef0] text-[#b94a57]'
                : 'bg-white border border-[#e7e1f2] text-[#7560da]'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">
              {profile.role === 'student' ? 'Баланс' : 'Доступ'}
            </div>
            <div className="text-lg font-bold">
              {profile.role === 'student'
                ? `${formatRating(profile.rating)} баллов`
                : 'Без ограничений'}
            </div>
          </div>
        </section>

        {/* ACTIVE BOOKING BANNER */}
        {activeBooking && (
          <aside
            id="active-booking-banner"
            className="mb-5 p-3.5 sm:p-4 rounded-xl border border-[#d8ccef] bg-[#fbf9fe] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            aria-label="Текущее активное бронирование"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#eaf7ee] text-[#278557] flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#7560da] uppercase tracking-wider">
                  Ваша активная бронь
                </div>
                <div className="text-sm font-bold text-[#2a2d3c]">
                  Коворкинг К{activeBooking.roomNumber} ({activeBooking.roomFloor} этаж) · {formatDate(activeBooking.date)} с {formatTime(activeBooking.startTime)} до {formatTime(activeBooking.endTime)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="banner-show-room-button"
                type="button"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#cfc3e8] bg-white text-[#2a2d3c] hover:bg-[#f6f2fd] transition-colors cursor-pointer"
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
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#7560da] text-white hover:bg-[#644fc9] transition-colors cursor-pointer"
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
                value={date}
                onChange={(event) => {
                  if (event.target.value) setDate(event.target.value);
                }}
              />
            </span>
          </label>
          <div className="time-control">
            <Clock3 size={19} />
            <span className="control-caption">Ко времени</span>
            <Select
              value={String(time)}
              onValueChange={(value) => {
                if (value !== null) setTime(Number(value));
              }}
            >
              <SelectTrigger
                className="time-select"
                aria-label="Время посещения"
              >
                <SelectValue>{formatTime(time)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
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
              aria-label="Только свободные коворкинги"
            />
            <span>Только свободные</span>
          </label>
        </section>
        <div className="availability-overview" aria-live="polite">
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
          <span className="overview-at">на {formatTime(time)}</span>
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
                            <span>Условная схема</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="room-list">
                        {floorRooms
                          .filter(
                            (room) =>
                              !onlyFree ||
                              getRoomState(room, date, time).status === 'free',
                          )
                          .map((room) => {
                            const current = getRoomState(room, date, time);
                            const isBookedByMe = activeBooking?.roomId === room.id;
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
                                  (isBookedByMe ? 'border-[#7560da] bg-[#fbf9fe]' : '')
                                }
                                onClick={() => selectRoom(room.id)}
                                aria-pressed={room.id === selectedId}
                              >
                                <span
                                  className={
                                    'list-room-icon room-' + current.status
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
                                        className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#7560da] text-white"
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
                                      : current.status + '-text')
                                  }
                                >
                                  <i />
                                  {isBookedByMe
                                    ? 'Забронировано вами'
                                    : current.label}
                                </span>
                                <ChevronRight size={18} />
                              </button>
                            );
                          })}
                        {onlyFree &&
                          !floorRooms.some(
                            (room) =>
                              getRoomState(room, date, time).status === 'free',
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
                    <div className="map-legend">
                      <span>
                        <i className="legend-free" />
                        Свободно
                      </span>
                      <span>
                        <i className="legend-soon" />
                        Бронь в течение 30 мин
                      </span>
                      <span>
                        <i className="legend-busy" />
                        Занято
                      </span>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            <div className="demo-note">
              <Info size={16} />
              <p>
                Расположение комнат и расписание условные. Коворкинги случайно
                распределены по трём этажам.
              </p>
            </div>
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
              <p id="selected-room-desc" className="detail-description">{selected.description}</p>

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
                    {formatDate(activeBooking.date)} · {formatTime(activeBooking.startTime)} — {formatTime(activeBooking.endTime)}
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
                    У вас уже забронирован коворкинг <strong>К{activeBooking.roomNumber}</strong> ({activeBooking.roomFloor} этаж). Чтобы забронировать это помещение, сначала отмените текущую бронь.
                  </div>
                </div>
              )}

              <div id="selected-room-availability-box" className={'availability-box availability-' + state.status}>
                <span className="availability-icon">
                  {state.status === 'busy' ? (
                    <Clock3 size={19} />
                  ) : (
                    <CheckCheck size={19} />
                  )}
                </span>
                <div>
                  <strong>{state.label}</strong>
                  <span>{state.description}</span>
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
              <div className="schedule-heading">
                <h3>Расписание на день</h3>
                <span>{formatDate(date, true)}</span>
              </div>
              <div id="room-timeline-bar" className="timeline" aria-label="Занятость с 8 до 22 часов">
                {getSchedule(selected, date).map((booking, index) => (
                  <span
                    key={index}
                    className="timeline-booking"
                    style={{
                      left: ((booking.start - 480) / 840) * 100 + '%',
                      width: ((booking.end - booking.start) / 840) * 100 + '%',
                    }}
                    title={
                      'Занято ' +
                      formatTime(booking.start) +
                      '–' +
                      formatTime(booking.end)
                    }
                  />
                ))}
                <span
                  className="timeline-marker"
                  style={{ left: ((time - 480) / 840) * 100 + '%' }}
                />
              </div>
              <div className="timeline-labels">
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>22:00</span>
              </div>
              <div id="room-schedule-list" className="schedule-list">
                {getSchedule(selected, date)
                  .filter((booking) => booking.end > time)
                  .slice(0, 2)
                  .map((booking, index) => (
                    <div key={index}>
                      <span>
                        <span className="schedule-dot" />
                        {formatTime(booking.start)} — {formatTime(booking.end)}
                      </span>
                      <span>Занято</span>
                    </div>
                  ))}
                {!getSchedule(selected, date).some(
                  (booking) => booking.end > time,
                ) && (
                  <div>
                    <span className="free-text">Свободно до закрытия</span>
                    <span>22:00</span>
                  </div>
                )}
              </div>

              {/* PRIMARY ACTION BUTTON */}
              <button
                id="choose-coworking-button"
                type="button"
                className="choose-button cursor-pointer"
                disabled={!isThisRoomBooked && state.status === 'busy'}
                onClick={() => setBookingDialogOpen(true)}
              >
                {isThisRoomBooked
                  ? 'Управление бронью этого места'
                  : state.status === 'busy'
                  ? 'Свободно с ' + formatTime(state.availableAt)
                  : 'Выбрать коворкинг'}
                {state.status !== 'busy' && <ArrowRight size={18} />}
              </button>
              <p id="choose-coworking-note" className="choose-note">
                {isThisRoomBooked
                  ? 'Бронь активна. Нажмите для просмотра или отмены'
                  : isOtherRoomBooked
                  ? 'У вас уже забронировано другое место'
                  : state.status === 'soon'
                  ? 'Подойдёт для короткой встречи (скоро занято)'
                  : 'Забронируйте помещение для индивидуальной или групповой работы'}
              </p>
            </div>
          </aside>
        </div>
        <footer id="site-footer" className="footer">
          <span>Есть место — учиться, работать, создавать.</span>
          <span>
            <span className="footer-dot" />
            Кампус открыт с 08:00 до 22:00
          </span>
        </footer>
      </main>

      {/* MODAL: BOOKING WORKFLOW */}
      <BookingDialog
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
    </div>
  );
}
