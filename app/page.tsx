'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
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
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  const [confirmation, setConfirmation] = useState(false);
  const selected = ROOMS.find((room) => room.id === selectedId)!;
  const state = getRoomState(selected, date, time);
  const floorRooms = ROOMS.filter((room) => room.floor === floor);
  const counts = { free: 0, soon: 0, busy: 0 };
  ROOMS.forEach((room) => counts[getRoomState(room, date, time).status]++);
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
    return (
      <button
        type="button"
        key={room.id}
        className={
          'room room-' +
          availability.status +
          (room.id === selectedId ? ' room-selected' : '') +
          (dimmed ? ' room-dimmed' : '')
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
          ' мест'
        }
        style={{ '--room-delay': index * 35 + 'ms' } as CSSProperties}
      >
        <span className="room-top">
          <span className="room-code">К{room.number}</span>
          {room.id === selectedId ? (
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
          {availability.shortLabel}
        </span>
      </button>
    );
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a href="/" className="brand" aria-label="Есть место — главная">
          <span className="brand-icon">
            <DoorOpen size={24} strokeWidth={2.4} />
          </span>
          <span>
            есть место<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="header-location">
          <Building2 size={17} />
          <span>Университетский кампус</span>
          <span className="header-separator" />
          <span className="muted">3 этажа · 23 коворкинга</span>
        </div>
        <span className="demo-pill">
          <span />
          Демо-версия
        </span>
      </header>
      <main className="workspace">
        <div className="breadcrumb">
          <span>Кампус</span>
          <ChevronRight size={14} />
          <span>Коворкинги</span>
        </div>
        <div className="page-heading">
          <div>
            <h1>Место для твоих идей</h1>
            <p>Найди свободный коворкинг на нужном этаже.</p>
          </div>
          <div className="campus-stamp">
            <Layers3 size={21} />
            <span>
              Один кампус.
              <br />
              <strong>23 возможности.</strong>
            </span>
          </div>
        </div>
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
          <label className="free-filter">
            <Switch
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
                            return (
                              <button
                                type="button"
                                key={room.id}
                                className={
                                  'list-room ' +
                                  (room.id === selectedId
                                    ? 'list-room-selected'
                                    : '')
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
                                  <strong>Коворкинг {room.number}</strong>
                                  <span>
                                    {room.kind} · {room.capacity} мест
                                  </span>
                                </span>
                                <span
                                  className={
                                    'list-status ' + current.status + '-text'
                                  }
                                >
                                  <i />
                                  {current.label}
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
              <h2>Коворкинг {selected.number}</h2>
              <p className="detail-description">{selected.description}</p>
              <div className={'availability-box availability-' + state.status}>
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
              <div className="amenities">
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
              <div className="timeline" aria-label="Занятость с 8 до 22 часов">
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
              <div className="schedule-list">
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
              <button
                type="button"
                className="choose-button"
                disabled={state.status === 'busy'}
                onClick={() => setConfirmation(true)}
              >
                {state.status === 'busy'
                  ? 'Свободно с ' + formatTime(state.availableAt)
                  : 'Выбрать коворкинг'}
                {state.status !== 'busy' && <ArrowRight size={18} />}
              </button>
              <p className="choose-note">
                {state.status === 'soon'
                  ? 'Подойдёт для короткой встречи'
                  : 'Выбор в демо-режиме, без бронирования'}
              </p>
            </div>
          </aside>
        </div>
        <footer className="footer">
          <span>Есть место — учиться, работать, создавать.</span>
          <span>
            <span className="footer-dot" />
            Кампус открыт с 08:00 до 22:00
          </span>
        </footer>
      </main>
      <Dialog open={confirmation} onOpenChange={setConfirmation}>
        <DialogContent className="confirmation-dialog" showCloseButton={false}>
          <div className="confirmation-icon">
            <Check size={30} />
          </div>
          <DialogTitle className="confirmation-title">
            Место выбрано
          </DialogTitle>
          <DialogDescription className="confirmation-description">
            Коворкинг {selected.number} · {selected.floor} этаж
            <br />
            {formatDate(date)} в {formatTime(time)}
          </DialogDescription>
          <div className="confirmation-note">
            <Info size={18} />
            <span>
              Это демонстрация интерфейса. Бронь не создана — подключим эту
              возможность позже.
            </span>
          </div>
          <button
            type="button"
            className="choose-button"
            onClick={() => setConfirmation(false)}
          >
            Понятно
            <Check size={18} />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
