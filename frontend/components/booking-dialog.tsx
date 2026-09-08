'use client';

import { useState, useMemo, useRef } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  DoorOpen,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  TIME_OPTIONS,
  formatTime,
  formatDate,
  getToday,
  getUpcomingDays,
  getOccupiedSeats,
  MIN_BOOKING_ATTENDEES,
  isScheduleLoaded,
  type Room,
} from '@/lib/campus';
import {
  useUserBookings,
  evaluateBookingPermission,
  createNewBooking,
  formatBookingDuration,
  POPULAR_PURPOSES,
  type UserBooking,
} from '@/lib/bookings';
import { type Translation, type Language, TRANSLATIONS } from '@/lib/translations';

type BookingDialogProps = {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: string;
  selectedTime?: number | null;
  lang?: Language;
  t?: Translation;
  onOpenMyBookings?: () => void;
  onSuccess?: (booking: UserBooking) => void;
};

function intervalFitsCapacity(
  bookings: { start: number; end: number; attendees: number }[],
  start: number,
  end: number,
  attendees: number,
  capacity: number,
) {
  return getOccupiedSeats(bookings, start, end) + attendees <= capacity;
}

export function BookingDialog({
  room,
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  lang = 'ru',
  t = TRANSLATIONS.ru,
  onOpenMyBookings,
  onSuccess,
}: BookingDialogProps) {
  const upcomingDays = useMemo(() => getUpcomingDays(7, getToday()), []);
  const [customBookingDate, setCustomBookingDate] = useState<string | null>(null);
  const bookingDate = customBookingDate !== null ? customBookingDate : (selectedDate || '');

  const { cancel, loading, error: storageError, schedules, serverTime } = useUserBookings(
    bookingDate || getToday(),
    selectedTime ?? 840,
  );

  const [userName, setUserName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [peopleCount, setPeopleCount] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(selectedTime ?? null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<UserBooking | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  // Existing schedule for this room on the chosen date
  const roomSchedule = useMemo(() => schedules.filter(slot => slot.roomId === room?.id && slot.date === bookingDate), [schedules, room, bookingDate]);

  const requestedPeople = peopleCount ?? MIN_BOOKING_ATTENDEES;
  const roomCapacity = room?.capacity ?? 0;
  const capacityLimitMessage =
    lang === 'ru'
      ? 'Нельзя превысить вместимость: на это время свободных мест недостаточно. Выберите другое время или меньше участников.'
      : 'Capacity limit exceeded: there are not enough free seats at this time. Choose another time or fewer people.';

  const isFutureStart = (value: number) =>
    Date.parse(`${bookingDate}T${formatTime(value)}:00+05:00`) > serverTime;

  // A time is unavailable only when the room has no remaining seats.
  const availableStartTimes = useMemo(() => {
    return TIME_OPTIONS.filter((st) => {
      if (st + 30 > 1320 || !isFutureStart(st)) return false;
      return intervalFitsCapacity(roomSchedule, st, st + 30, requestedPeople, roomCapacity);
    });
  }, [roomSchedule, bookingDate, serverTime, requestedPeople, roomCapacity]);

  // Keep all possible end times available. If an end would exceed the booking
  // limits, the start time is corrected only as much as necessary.
  const availableEndTimes = useMemo(() => {
    if (startTime === null) return [];
    return TIME_OPTIONS.filter((end) => {
      if (end < 510) return false;
      let adjustedStart = startTime;
      if (end - adjustedStart > 240) adjustedStart = end - 240;
      if (end - adjustedStart < 30) adjustedStart = end - 30;
      return adjustedStart >= 480 && isFutureStart(adjustedStart) && intervalFitsCapacity(roomSchedule, adjustedStart, end, requestedPeople, roomCapacity);
    });
  }, [startTime, roomSchedule, bookingDate, serverTime, requestedPeople, roomCapacity]);

  // The lists keep times that can be reached by adjusting the other boundary
  // when necessary. These sets mark the choices that already form a valid
  // 30-minute–4-hour interval with the currently selected boundary.
  const highlightedStartTimes = useMemo(() => {
    if (endTime === null) return new Set<number>();
    return new Set(
      availableStartTimes.filter(
        (start) =>
          endTime - start >= 30 &&
          endTime - start <= 240 &&
          intervalFitsCapacity(roomSchedule, start, endTime, requestedPeople, roomCapacity),
      ),
    );
  }, [availableStartTimes, endTime, roomSchedule, requestedPeople, roomCapacity]);

  const highlightedEndTimes = useMemo(() => {
    if (startTime === null) return new Set<number>();
    return new Set(
      availableEndTimes.filter(
        (end) =>
          end - startTime >= 30 &&
          end - startTime <= 240 &&
          intervalFitsCapacity(roomSchedule, startTime, end, requestedPeople, roomCapacity),
      ),
    );
  }, [availableEndTimes, startTime, roomSchedule, requestedPeople, roomCapacity]);

  const maximumPeople = useMemo(() => {
    if (startTime === null || endTime === null) return roomCapacity;
    return Math.max(0, roomCapacity - getOccupiedSeats(roomSchedule, startTime, endTime));
  }, [roomCapacity, roomSchedule, startTime, endTime]);
  const peopleLimit = startTime !== null && endTime !== null ? maximumPeople : roomCapacity;

  function findEndForStart(start: number, preferredEnd: number) {
    const ends: number[] = [];
    for (let end = start + 30; end <= Math.min(start + 240, 1320); end += 30) {
      if (intervalFitsCapacity(roomSchedule, start, end, requestedPeople, roomCapacity)) ends.push(end);
    }
    return ends.sort((a, b) => Math.abs(a - preferredEnd) - Math.abs(b - preferredEnd))[0] ?? null;
  }

  function findStartForEnd(end: number, preferredStart: number) {
    const starts: number[] = [];
    for (let start = Math.max(480, end - 240); start <= end - 30; start += 30) {
      if (isFutureStart(start) && intervalFitsCapacity(roomSchedule, start, end, requestedPeople, roomCapacity)) starts.push(start);
    }
    return starts.sort((a, b) => Math.abs(a - preferredStart) - Math.abs(b - preferredStart))[0] ?? null;
  }

  const formatBookingDateOption = (dayStr: string): string => {
    const d = new Date(dayStr + 'T12:00:00');
    const dayNum = d.getDate();
    const monthsRu = [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ];
    const monthsEn = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const weekDaysRu = [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ];
    const weekDaysEn = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const m = lang === 'ru' ? monthsRu[d.getMonth()] : monthsEn[d.getMonth()];
    const wd = lang === 'ru' ? weekDaysRu[d.getDay()] : weekDaysEn[d.getDay()];
    return `${wd}, ${dayNum} ${m}`;
  };

  if (!room) return null;

  const permission = evaluateBookingPermission(
    room.id,
    bookingDate,
    startTime,
    endTime,
  );
  const activeBooking = permission.activeBooking;
  const isThisRoomBookedByMe = permission.isSameRoomBooked && activeBooking;
  const isAnotherRoomBookedByMe =
    !permission.allowed && !permission.isSameRoomBooked && activeBooking;

  function handleStartTimeChange(value: string) {
    if (value === 'empty' || !value) {
      setStartTime(null);
      setEndTime(null);
      return;
    }

    const nextStart = Number(value);
    if (endTime === null) {
      setStartTime(nextStart);
      setErrorMsg(null);
      return;
    }

    let nextEnd = endTime;
    if (nextEnd - nextStart < 30) nextEnd = nextStart + 30;
    if (nextEnd - nextStart > 240) nextEnd = nextStart + 240;
    if (nextEnd > 1320 || !intervalFitsCapacity(roomSchedule, nextStart, nextEnd, requestedPeople, roomCapacity)) {
      nextEnd = findEndForStart(nextStart, Math.min(nextEnd, 1320));
    }
    setStartTime(nextStart);
    setEndTime(nextEnd);
    setErrorMsg(nextEnd === null ? capacityLimitMessage : null);
  }

  function handleEndTimeChange(value: string) {
    if (value === 'empty' || !value) {
      setEndTime(null);
      return;
    }
    const nextEnd = Number(value);
    if (startTime === null) return;

    let nextStart = startTime;
    if (nextEnd - nextStart < 30) nextStart = nextEnd - 30;
    if (nextEnd - nextStart > 240) nextStart = nextEnd - 240;
    if (nextStart < 480 || !isFutureStart(nextStart) || !intervalFitsCapacity(roomSchedule, nextStart, nextEnd, requestedPeople, roomCapacity)) {
      nextStart = findStartForEnd(nextEnd, Math.max(480, nextStart));
    }
    setStartTime(nextStart);
    setEndTime(nextStart === null ? null : nextEnd);
    setErrorMsg(nextStart === null ? capacityLimitMessage : null);
  }

  async function handleBookingSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!room || submitting.current) return;
    if (!bookingDate) {
      setErrorMsg(
        lang === 'ru'
          ? 'Пожалуйста, выберите дату.'
          : 'Please select a date.',
      );
      return;
    }
    if (startTime === null || endTime === null) {
      setErrorMsg(
        lang === 'ru'
          ? 'Пожалуйста, выберите время начала и окончания бронирования.'
          : 'Please select both start and end time.',
      );
      return;
    }
    if (peopleCount === null) {
      setErrorMsg(
        lang === 'ru'
          ? 'Пожалуйста, выберите количество человек.'
          : 'Please select number of people.',
      );
      return;
    }

    if (!intervalFitsCapacity(roomSchedule, startTime, endTime, peopleCount, roomCapacity)) {
      setErrorMsg(
        lang === 'ru'
          ? 'На выбранный интервал не хватает свободных мест.'
          : 'There are not enough free seats for this interval.',
      );
      return;
    }

    setErrorMsg(null);

    submitting.current = true;
    setPending(true);
    const result = await createNewBooking({
      room,
      date: bookingDate,
      startTime,
      endTime,
      userName,
      purpose,
      attendees: peopleCount ?? MIN_BOOKING_ATTENDEES,
    });

    submitting.current = false;
    setPending(false);
    if (!result.success) {
      setErrorMsg(
        result.error ??
          (lang === 'ru'
            ? 'Произошла ошибка при бронировании'
            : 'An error occurred while booking'),
      );
      return;
    }

    setIsSuccess(true);
    setCreatedBooking(result.booking ?? null);
    if (result.booking && onSuccess) {
      onSuccess(result.booking);
    }
  }

  async function handleCancelBooking() {
    if (!activeBooking) return;
    const res = await cancel(activeBooking.id);
    if (res.success) {
      setConfirmCancel(false);
      onOpenChange(false);
    } else {
      setErrorMsg(
        res.error ??
          (lang === 'ru' ? 'Не удалось отменить бронь' : 'Failed to cancel reservation'),
      );
    }
  }

  const localizedPurposes =
    lang === 'ru'
      ? POPULAR_PURPOSES
      : [
          'Team project',
          'Online call',
          'Meeting and discussion',
          'Individual work',
          'Exam preparation',
          'Presentation preparation',
          'Coursework',
          'Thesis work',
          'Academic consultation',
          'Project meeting',
          'Brainstorming',
          'Preparing online materials',
        ];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (pending) return;
        if (nextOpen) {
          setCustomBookingDate(null);
          setStartTime(selectedTime ?? null);
          setEndTime(null);
          setPeopleCount(null);
          setErrorMsg(null);
        } else {
          setIsSuccess(false);
          setCreatedBooking(null);
          setErrorMsg(null);
          setConfirmCancel(false);
          setStartTime(selectedTime ?? null);
          setEndTime(null);
          setCustomBookingDate(null);
          setUserName('');
          setPurpose('');
          setPeopleCount(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="confirmation-dialog w-[95vw] sm:max-w-[540px] p-6 sm:p-7 overflow-y-auto overflow-x-hidden max-h-[90vh]"
        showCloseButton={false}
      >
        {/* Success View */}
        {isSuccess && createdBooking ? (
          <div className="flex flex-col gap-4 text-center items-center py-2">
            <div className="confirmation-icon mx-auto">
              <Check size={32} />
            </div>
            <DialogTitle className="confirmation-title text-2xl font-bold text-[#2a2d3c] dark:text-foreground">
              {lang === 'ru' ? 'Коворкинг забронирован!' : 'Workspace reserved!'}
            </DialogTitle>
            <DialogDescription className="confirmation-description text-[#6c647e] dark:text-muted-foreground text-base">
              {lang === 'ru' ? 'Ждём вас в коворкинге ' : 'We look forward to seeing you at '}
              <span className="font-normal text-[#2a2d3c] dark:text-foreground">{room.number}</span> (
              {room.floor} {t.floorWord})
            </DialogDescription>

            <div className="w-full bg-[#f8f6fc] dark:bg-card border border-[#e8e2f4] dark:border-border rounded-xl p-4 text-left flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between items-center text-[#7560da] font-medium border-b border-[#ebdff8] dark:border-border pb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} />
                  {formatDate(createdBooking.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} />
                  {formatTime(createdBooking.startTime)} — {formatTime(createdBooking.endTime)}
                </span>
              </div>
              <div className="text-[#514a66] dark:text-foreground">
                <span className="text-[#8e879f] text-xs block">
                  {lang === 'ru' ? 'Имя:' : 'Name:'}
                </span>
                <span className="font-normal">{createdBooking.userName}</span>
              </div>
              {createdBooking.attendees && (
                <div className="text-[#514a66] dark:text-foreground">
                  <span className="text-[#8e879f] text-xs block">
                    {t.peopleCountLabel}:
                  </span>
                  <span className="font-medium">
                    {createdBooking.attendees}{' '}
                    {lang === 'ru'
                      ? createdBooking.attendees === 1
                        ? 'человек'
                        : createdBooking.attendees < 5
                        ? 'человека'
                        : 'человек'
                      : createdBooking.attendees === 1
                      ? 'person'
                      : 'people'}
                  </span>
                </div>
              )}
              <div className="text-[#514a66] dark:text-foreground">
                <span className="text-[#8e879f] text-xs block">
                  {t.purpose}:
                </span>
                <span className="font-medium">{t.purposes[createdBooking.purpose] || createdBooking.purpose}</span>
              </div>
            </div>

            <button
              id="booking-success-close-button"
              type="button"
              className="choose-button mt-2 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              {lang === 'ru' ? 'Хорошо' : 'Okay'}
              <Check size={18} />
            </button>
          </div>
        ) : isThisRoomBookedByMe ? (
          /* Already Booked by Current User: Room Cancellation State */
          <div id="booking-active-room-view" className="flex flex-col gap-4 py-1">
            <div className="flex items-center gap-3 border-b border-[#ece7f6] dark:border-border pb-4">
              <div className="w-12 h-12 rounded-xl bg-[#eaf7ee] text-[#278557] flex items-center justify-center shrink-0">
                <DoorOpen size={24} />
              </div>
              <div>
                <DialogTitle id="booking-active-dialog-title" className="text-xl font-bold text-[#2a2d3c] dark:text-foreground m-0">
                  {lang === 'ru' ? 'Ваша бронь' : 'Your reservation'}
                </DialogTitle>
                <DialogDescription id="booking-active-dialog-desc" className="text-sm text-[#777c8e] dark:text-muted-foreground m-0">
                  {t.coworking} {room.number} · {room.floor} {t.floorWord}
                </DialogDescription>
              </div>
            </div>

            <div id="booking-active-details-card" className="bg-[#f7f8fb] dark:bg-card border border-[#e4e7f0] dark:border-border rounded-xl p-4 flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-[#e7e9f2] dark:border-border">
                <span className="text-[#777c8e] flex items-center gap-1.5">
                  <Calendar size={15} />
                  {t.dateLabel}
                </span>
                <span className="font-semibold text-[#2a2d3c] dark:text-foreground">
                  {formatDate(activeBooking.date)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-[#e7e9f2] dark:border-border">
                <span className="text-[#777c8e] flex items-center gap-1.5">
                  <Clock size={15} />
                  {t.time}
                </span>
                <span className="font-semibold text-[#7560da]">
                  {formatTime(activeBooking.startTime)} — {formatTime(activeBooking.endTime)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-[#e7e9f2] dark:border-border">
                <span className="text-[#777c8e] flex items-center gap-1.5">
                  <Users size={15} />
                  {t.peopleCountLabel}
                </span>
                <span className="font-normal text-[#2a2d3c] dark:text-foreground">
                  {activeBooking.attendees} / {activeBooking.roomCapacity}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-[#e7e9f2] dark:border-border">
                <span className="text-[#777c8e]">{t.purpose}</span>
                <span className="font-medium text-[#2a2d3c] dark:text-foreground">
                  {t.purposes[activeBooking.purpose] || activeBooking.purpose}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#777c8e]">
                  {lang === 'ru' ? 'Статус' : 'Status'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#eaf7ee] text-[#278557] font-semibold text-xs">
                  {t.active}
                </span>
              </div>
            </div>

            {confirmCancel ? (
              <div className="bg-[#fdeef0] dark:bg-[#32171c] border border-[#f5ccd2] rounded-xl p-4 flex flex-col gap-3">
                <span className="text-sm font-semibold text-[#cf414d]">
                  {t.confirmCancel}
                </span>
                <div className="flex gap-2">
                  <button
                    id="booking-confirm-cancel-btn"
                    type="button"
                    className="flex-1 h-9 rounded-lg bg-[#cf414d] text-white hover:bg-[#b53440] font-medium text-xs transition-colors cursor-pointer"
                    onClick={handleCancelBooking}
                  >
                    {lang === 'ru' ? 'Да, отменить' : 'Yes, cancel'}
                  </button>
                  <button
                    id="booking-dismiss-cancel-btn"
                    type="button"
                    className="flex-1 h-9 rounded-lg bg-card border border-border text-foreground hover:bg-muted font-medium text-xs transition-colors cursor-pointer"
                    onClick={() => setConfirmCancel(false)}
                  >
                    {lang === 'ru' ? 'Назад' : 'Back'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="booking-start-cancel-button"
                  type="button"
                  className="h-11 w-full rounded-lg border border-[#cf414d] text-[#cf414d] hover:bg-[#fdeef0] dark:hover:bg-[#32171c] font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => setConfirmCancel(true)}
                >
                  {t.cancelBooking}
                  <Trash2 size={16} />
                </button>
                <button
                  id="booking-keep-active-button"
                  type="button"
                  className="choose-button cursor-pointer"
                  onClick={() => onOpenChange(false)}
                >
                  {lang === 'ru' ? 'Оставить бронь активной' : 'Keep reservation'}
                  <Check size={17} />
                </button>
              </div>
            )}
          </div>
        ) : isAnotherRoomBookedByMe ? (
          /* User already has a booking in ANOTHER room */
          <div id="booking-conflict-view" className="flex flex-col gap-4 py-1">
            <div className="w-12 h-12 rounded-xl bg-[#fff6dd] text-[#94630b] flex items-center justify-center">
              <AlertCircle size={26} />
            </div>
            <div>
              <DialogTitle id="booking-conflict-title" className="text-xl font-bold text-[#2a2d3c] dark:text-foreground mb-1">
                {lang === 'ru' ? 'У вас уже есть бронирование' : 'You already have an active reservation'}
              </DialogTitle>
              <DialogDescription id="booking-conflict-desc" className="text-sm text-[#777c8e] dark:text-muted-foreground">
                {t.campusRuleNotice}
              </DialogDescription>
            </div>

            <div id="booking-conflict-details-card" className="bg-[#fff9ea] border border-[#f5e3b5] rounded-xl p-4 text-sm flex flex-col gap-2 text-[#795411]">
              <div className="font-semibold flex items-center gap-1.5">
                <DoorOpen size={16} />
                {lang === 'ru' ? 'Текущая бронь:' : 'Current reservation:'} {t.coworking} {activeBooking.roomNumber} ({activeBooking.roomFloor} {t.floorWord})
              </div>
              <div className="text-xs text-[#8f6d2b]">
                {formatDate(activeBooking.date)} ·{' '}
                {formatTime(activeBooking.startTime)} — {formatTime(activeBooking.endTime)}
              </div>
              <div className="text-xs text-[#8f6d2b]">
                {t.purpose}: {t.purposes[activeBooking.purpose] || activeBooking.purpose}
              </div>
            </div>

            <div className="text-xs text-[#7d798a] leading-relaxed">
              {lang === 'ru'
                ? `Чтобы забронировать коворкинг ${room.number}, сначала отмените текущую бронь.`
                : `To reserve workspace ${room.number}, please cancel your current reservation first.`}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 w-full">
              <button
                id="booking-conflict-close-button"
                type="button"
                className="choose-button cursor-pointer flex items-center justify-center gap-2 w-full"
                onClick={() => onOpenChange(false)}
              >
                {t.close} <X size={17} />
              </button>
              {onOpenMyBookings ? (
                <button
                  id="booking-conflict-goto-mybookings-button"
                  type="button"
                  className="choose-button cursor-pointer flex items-center justify-center gap-2 w-full"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenMyBookings();
                  }}
                >
                  {t.goToMyBookings}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  id="booking-conflict-cancel-prev-button"
                  type="button"
                  className="h-11 w-full rounded-lg border border-[#b94a57] text-[#b94a57] hover:bg-[#fdeef0] dark:hover:bg-[#32171c] font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  onClick={handleCancelBooking}
                >
                  <Trash2 size={16} />
                  {lang === 'ru'
                    ? `Отменить бронь`
                    : `Cancel reservation`}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Normal Booking Form */
          <form id="new-booking-form" onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
            {/* Header info */}
            <div className="border-b border-[#ece7f6] dark:border-border pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#7560da] block">
                {t.bookingDialogTitle}
              </span>
              <DialogTitle className="text-2xl font-bold text-[#2a2d3c] dark:text-foreground mt-1 mb-0.5">
                {t.coworking} {room.number}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#777c8e] dark:text-muted-foreground">
                {room.floor} {t.floorWord}
              </DialogDescription>
            </div>

            {errorMsg && (
              <div className="bg-[#fdeef0] dark:bg-[#32171c] border border-[#f5ccd2] text-[#cf414d] text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date & Time fields */}
            <div className="flex flex-col gap-3">
              <div>
                <span className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground mb-1.5 select-none">
                  {t.dateLabel}
                </span>
                <Select
                  value={bookingDate || null}
                  onValueChange={(val) => {
                    if (val) {
                      setCustomBookingDate(val);
                      setStartTime(null);
                      setEndTime(null);
                    }
                  }}
                >
                  <SelectTrigger id="booking-date-select" className="w-full h-10 bg-card select-none cursor-pointer">
                    <SelectValue placeholder={t.selectDatePrompt}>
                      <span className={`select-none ${bookingDate ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {bookingDate ? formatBookingDateOption(bookingDate) : t.selectDatePrompt}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {upcomingDays.map((d) => (
                      <SelectItem key={d} value={d} className="select-none cursor-pointer">
                        {formatBookingDateOption(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground mb-1.5 select-none">
                    {t.startTimeLabel}
                  </span>
                  <Select
                    value={startTime !== null ? String(startTime) : null}
                    onValueChange={(val) => {
                      if (val) handleStartTimeChange(val);
                    }}
                  >
                    <SelectTrigger id="booking-start-time-select" className="w-full h-10 bg-card select-none cursor-pointer">
                      <SelectValue placeholder={t.selectTimePrompt}>
                        <span className={`select-none ${startTime !== null ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {startTime !== null ? formatTime(startTime) : t.selectTimePrompt}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableStartTimes.map((val) => (
                        <SelectItem
                          key={val}
                          value={String(val)}
                          className={`select-none cursor-pointer ${
                            highlightedStartTimes.has(val)
                              ? 'text-[#6250c8] font-semibold'
                              : ''
                          }`}
                        >
                          {formatTime(val)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground mb-1.5 select-none">
                    {t.endTimeLabel}
                  </span>
                  <Select
                    value={endTime !== null ? String(endTime) : null}
                    onValueChange={(val) => {
                      if (val) handleEndTimeChange(val);
                    }}
                    disabled={startTime === null}
                  >
                    <SelectTrigger id="booking-end-time-select" className="w-full h-10 bg-card select-none cursor-pointer">
                      <SelectValue placeholder={t.selectTimePrompt}>
                        <span className={`select-none ${endTime !== null ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {endTime !== null ? formatTime(endTime) : t.selectTimePrompt}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableEndTimes.map((val) => (
                        <SelectItem
                          key={val}
                          value={String(val)}
                          className={`select-none cursor-pointer ${
                            highlightedEndTimes.has(val)
                              ? 'text-[#6250c8] font-semibold'
                              : ''
                          }`}
                        >
                          {formatTime(val)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration and helper info */}
              {!bookingDate ? (
                <p id="booking-date-hint" className="text-[11px] text-[#8e879f] -mt-1 px-1 select-none">
                  {lang === 'ru' ? 'Сначала выберите дату.' : 'Please select a date first.'}
                </p>
              ) : startTime !== null && endTime !== null && endTime > startTime ? (
                <div id="booking-duration-hint" className="text-xs text-[#7560da] font-medium flex items-center justify-between -mt-1 px-1 select-none">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>
                      {t.durationLabel}:{' '}
                      <strong>{formatBookingDuration(startTime, endTime)}</strong>
                    </span>
                  </span>
                  <span className="text-[#8e879f] text-[11px]">
                    {lang === 'ru' ? 'от 30 мин до 4 ч' : '30 min to 4 hours'}
                  </span>
                </div>
              ) : (
                <p id="booking-time-hint" className="text-[11px] text-[#8e879f] -mt-1 px-1 select-none">
                  {startTime === null
                    ? lang === 'ru'
                      ? 'Сначала выберите время начала.'
                      : 'Please select start time first.'
                    : lang === 'ru'
                    ? 'Выберите время окончания (от 30 мин до 4 часов).'
                    : 'Select end time (from 30 min up to 4 hours).'}
                </p>
              )}
            </div>

            {/* People count selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground select-none">
                  {t.peopleCountLabel}
                </span>
                <button
                  id="booking-maximum-people-button"
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                  disabled={startTime !== null && endTime !== null && maximumPeople < MIN_BOOKING_ATTENDEES}
                  onClick={() => setPeopleCount(maximumPeople || room.capacity)}
                >
                  {t.maximum}
                </button>
              </div>
              <Select
                value={peopleCount !== null ? String(peopleCount) : null}
                onValueChange={(val) => {
                  if (val) {
                    const nextPeople = Number(val);
                    setPeopleCount(nextPeople);
                    if (startTime !== null && endTime !== null && !intervalFitsCapacity(roomSchedule, startTime, endTime, nextPeople, roomCapacity)) {
                      setEndTime(null);
                      setErrorMsg(capacityLimitMessage);
                    } else {
                      setErrorMsg(null);
                    }
                  }
                }}
              >
                <SelectTrigger id="booking-people-count-select" className="w-full h-10 bg-card select-none cursor-pointer">
                  <SelectValue placeholder={lang === 'ru' ? 'Выберите количество' : 'Select count'}>
                    <span className={`select-none ${peopleCount !== null ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {peopleCount !== null
                        ? `${peopleCount} ${
                            lang === 'ru'
                              ? peopleCount === 1
                                ? 'человек'
                                : peopleCount < 5
                                ? 'человека'
                                : 'человек'
                              : peopleCount === 1
                              ? 'person'
                              : 'people'
                          }`
                        : lang === 'ru'
                        ? 'Выберите количество'
                        : 'Select count'}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({
                    length: Math.max(peopleLimit - MIN_BOOKING_ATTENDEES + 1, 0),
                  }, (_, i) => i + MIN_BOOKING_ATTENDEES).map((cnt) => (
                    <SelectItem key={cnt} value={String(cnt)} className="select-none cursor-pointer">
                      <span>
                        {cnt}{' '}
                        {lang === 'ru'
                          ? cnt === 1
                            ? 'человек'
                            : cnt < 5
                            ? 'человека'
                            : 'человек'
                          : cnt === 1
                          ? 'person'
                          : 'people'}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name input */}
            <div>
              <label
                htmlFor="booking-user-name"
                className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground mb-1.5"
              >
                {t.nameLabel}
              </label>
              <Input
                id="booking-user-name"
                type="text"
                placeholder={t.namePlaceholder || (lang === 'ru' ? 'Например, Иван Иванов' : 'e.g. Alex Johnson')}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="h-10"
              />
            </div>

            {/* Purpose input */}
            <div>
              <span className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground mb-1.5">
                {t.purposeLabel}
              </span>
              <Select
                value={purpose || null}
                onValueChange={(val) => {
                  if (val) setPurpose(val);
                }}
              >
                <SelectTrigger id="booking-purpose-select" className="w-full h-10 bg-card mb-2">
                  <SelectValue placeholder={lang === 'ru' ? 'Выберите цель посещения' : 'Select purpose'}>
                    {purpose || (lang === 'ru' ? 'Выберите цель посещения' : 'Select purpose')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {localizedPurposes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action buttons: Close & Submit (each takes 50% width) */}
            <div className="grid grid-cols-2 gap-3 mt-1 w-full">
              <button
                id="booking-cancel-modal-button"
                type="button"
                className="choose-button cursor-pointer flex items-center justify-center gap-2 w-full"
                onClick={() => onOpenChange(false)}
              >
                {t.close} <X size={17} />
              </button>
              <button
                id="booking-submit-button"
                type="submit"
                className="choose-button cursor-pointer flex items-center justify-center gap-2 w-full"
                disabled={
                  pending || loading || Boolean(storageError) || !isScheduleLoaded(bookingDate) ||
                  !userName.trim() ||
                  !bookingDate ||
                  peopleCount === null ||
                  !purpose ||
                  startTime === null ||
                  endTime === null ||
                  endTime - startTime < 30 ||
                  endTime - startTime > 240
                }
              >
                {pending ? (lang === 'ru' ? 'Сохраняем…' : 'Saving…') : t.confirmBookingButton}
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
