'use client';

import { useState, useMemo, useRef } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  DoorOpen,
  Info,
  Trash2,
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
  const [customPurpose, setCustomPurpose] = useState('');
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

  // Available start times:
  // 1. Campus closing limit: start + 30 <= 1320 (22:00)
  // 2. Start is not during an already booked slot
  // 3. Has at least 30 minutes before the next booking starts
  const availableStartTimes = useMemo(() => {
    return TIME_OPTIONS.filter((st) => {
      if (st + 30 > 1320 || Date.parse(`${bookingDate}T${formatTime(st)}:00+05:00`) <= serverTime) return false;
      const isInside = roomSchedule.some((b) => b.start <= st && b.end > st);
      if (isInside) return false;
      const overlapsNext = roomSchedule.some((b) => b.start > st && b.start < st + 30);
      if (overlapsNext) return false;
      return true;
    });
  }, [roomSchedule, bookingDate, serverTime]);

  // Next booking that begins strictly after the chosen start time
  const nextBookingAfterStart = useMemo(() => {
    if (startTime === null) return null;
    const futureBookings = roomSchedule
      .filter((b) => b.start > startTime)
      .sort((a, b) => a.start - b.start);
    return futureBookings[0] || null;
  }, [roomSchedule, startTime]);

  // Available end times:
  // Min 30 min, max 4 hours (240 min), up to campus closing (22:00 = 1320 min),
  // and CANNOT extend into/past the next scheduled booking!
  const availableEndTimes = useMemo(() => {
    if (startTime === null) return [];
    const minEnd = startTime + 30;
    const maxAllowed = Math.min(
      startTime + 240,
      1320,
      nextBookingAfterStart ? nextBookingAfterStart.start : 1320,
    );
    const times: number[] = [];
    for (let tOpt = minEnd; tOpt <= maxAllowed; tOpt += 30) {
      times.push(tOpt);
    }
    return times;
  }, [startTime, nextBookingAfterStart]);

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
    setStartTime(nextStart);

    const nextBooking = roomSchedule
      .filter((b) => b.start > nextStart)
      .sort((a, b) => a.start - b.start)[0];
    const maxAllowed = Math.min(
      nextStart + 240,
      1320,
      nextBooking ? nextBooking.start : 1320,
    );

    if (endTime !== null) {
      if (endTime < nextStart + 30 || endTime > maxAllowed) {
        setEndTime(null);
      }
    }
  }

  function handleEndTimeChange(value: string) {
    if (value === 'empty' || !value) {
      setEndTime(null);
      return;
    }
    setEndTime(Number(value));
  }

  const otherPurposeLabel = lang === 'ru' ? 'Другая цель' : 'Other purpose';

  function handlePurposeChange(value: string) {
    setPurpose(value);
    if (value !== otherPurposeLabel) {
      setCustomPurpose('');
    }
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

    // Verify time does not conflict with existing schedule
    const hasConflict = roomSchedule.some(
      (b) => Math.max(startTime, b.start) < Math.min(endTime, b.end),
    );
    if (hasConflict) {
      setErrorMsg(
        lang === 'ru'
          ? 'Выбранное время пересекается с существующей бронью этого коворкинга.'
          : 'Selected time overlaps with an existing reservation.',
      );
      return;
    }

    setErrorMsg(null);

    const finalPurpose =
      purpose === otherPurposeLabel ? customPurpose.trim() : purpose;

    submitting.current = true;
    setPending(true);
    const result = await createNewBooking({
      room,
      date: bookingDate,
      startTime,
      endTime,
      userName,
      purpose: finalPurpose,
      attendees: peopleCount ?? 1,
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
          'Team project / Meeting',
          'Online call / Video conference',
          'Discussion and brainstorming',
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
          setCustomPurpose('');
          setPeopleCount(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="confirmation-dialog max-w-[500px] w-full p-6 sm:p-7 overflow-y-auto max-h-[90vh]"
        showCloseButton={true}
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
              <strong className="text-[#2a2d3c] dark:text-foreground">{room.number}</strong> (
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
                <span className="font-medium">{createdBooking.userName}</span>
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
                <span className="font-medium">{createdBooking.purpose}</span>
              </div>
            </div>

            <div className="confirmation-note text-left w-full">
              <Info size={18} />
              <span>
                {lang === 'ru'
                  ? 'Бронь закреплена за вами. Если планы изменятся, вы можете отменить её в любой момент в «Моих бронированиях».'
                  : 'Reservation confirmed. If your plans change, you can cancel it anytime in "My Bookings".'}
              </span>
            </div>

            <button
              id="booking-success-close-button"
              type="button"
              className="choose-button mt-2 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              {lang === 'ru' ? 'Отлично, понятно' : 'Got it, thanks'}
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
                  {lang === 'ru' ? 'Ваша активная бронь' : 'Your active reservation'}
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
                <span className="text-[#777c8e]">{t.purpose}</span>
                <span className="font-medium text-[#2a2d3c] dark:text-foreground">
                  {activeBooking.purpose}
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
              <div className="flex flex-col gap-2 pt-1">
                <button
                  id="booking-start-cancel-button"
                  type="button"
                  className="h-11 w-full rounded-lg border border-[#cf414d] text-[#cf414d] hover:bg-[#fdeef0] dark:hover:bg-[#32171c] font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => setConfirmCancel(true)}
                >
                  <Trash2 size={16} />
                  {t.cancelBooking}
                </button>
                <button
                  id="booking-keep-active-button"
                  type="button"
                  className="choose-button cursor-pointer"
                  onClick={() => onOpenChange(false)}
                >
                  {lang === 'ru' ? 'Оставить бронь активной' : 'Keep reservation'}
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
                {lang === 'ru' ? 'Текущая бронь:' : 'Current reservation:'} {activeBooking.roomNumber} (
                {activeBooking.roomFloor} {t.floorWord})
              </div>
              <div className="text-xs text-[#8f6d2b]">
                {formatDate(activeBooking.date)} ·{' '}
                {formatTime(activeBooking.startTime)} — {formatTime(activeBooking.endTime)}
              </div>
              <div className="text-xs text-[#8f6d2b]">
                {t.purpose}: {activeBooking.purpose}
              </div>
            </div>

            <div className="text-xs text-[#7d798a] leading-relaxed">
              {lang === 'ru'
                ? `Чтобы забронировать коворкинг ${room.number}, сначала отмените текущую бронь.`
                : `To reserve workspace ${room.number}, please cancel your current reservation first.`}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="booking-conflict-cancel-prev-button"
                type="button"
                className="h-11 w-full rounded-lg border border-[#b94a57] text-[#b94a57] hover:bg-[#fdeef0] dark:hover:bg-[#32171c] font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                onClick={handleCancelBooking}
              >
                <Trash2 size={16} />
                {lang === 'ru'
                  ? `Отменить бронь коворкинга ${activeBooking.roomNumber}`
                  : `Cancel reservation for coworking ${activeBooking.roomNumber}`}
              </button>
              {onOpenMyBookings && (
                <button
                  id="booking-conflict-goto-mybookings-button"
                  type="button"
                  className="choose-button cursor-pointer"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenMyBookings();
                  }}
                >
                  {t.goToMyBookings}
                  <ArrowRight size={16} />
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
                <span className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground mb-1.5">
                  {t.dateLabel}
                </span>
                <Select
                  value={bookingDate || 'empty'}
                  onValueChange={(val) => {
                    if (val === 'empty' || !val) {
                      setCustomBookingDate('');
                    } else {
                      setCustomBookingDate(val);
                    }
                    setStartTime(null);
                    setEndTime(null);
                  }}
                >
                  <SelectTrigger id="booking-date-select" className="w-full h-10 bg-card">
                    <SelectValue placeholder={t.selectDatePrompt}>
                      <div className="flex items-center gap-2">
                        <Calendar size={15} className="text-[#8e879f]" />
                        <span className={bookingDate ? '' : 'text-muted-foreground'}>
                          {bookingDate ? formatDate(bookingDate) : t.selectDatePrompt}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empty">
                      {t.selectDatePrompt}
                    </SelectItem>
                    {upcomingDays.map((d) => (
                      <SelectItem key={d} value={d}>
                        {formatDate(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground mb-1.5">
                    {t.startTimeLabel}
                  </span>
                  <Select
                    value={startTime !== null ? String(startTime) : 'empty'}
                    onValueChange={(val) => {
                      if (val) handleStartTimeChange(val);
                    }}
                  >
                    <SelectTrigger id="booking-start-time-select" className="w-full h-10 bg-card">
                      <SelectValue placeholder={t.selectTimePrompt}>
                        <span className={startTime !== null ? '' : 'text-muted-foreground'}>
                          {startTime !== null ? formatTime(startTime) : t.selectTimePrompt}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empty">
                        {t.selectTimePrompt}
                      </SelectItem>
                      {availableStartTimes.map((val) => (
                        <SelectItem key={val} value={String(val)}>
                          {formatTime(val)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground mb-1.5">
                    {t.endTimeLabel}
                  </span>
                  <Select
                    value={endTime !== null ? String(endTime) : 'empty'}
                    onValueChange={(val) => {
                      if (val) handleEndTimeChange(val);
                    }}
                    disabled={startTime === null}
                  >
                    <SelectTrigger id="booking-end-time-select" className="w-full h-10 bg-card">
                      <SelectValue placeholder={t.selectTimePrompt}>
                        <span className={endTime !== null ? '' : 'text-muted-foreground'}>
                          {endTime !== null ? formatTime(endTime) : t.selectTimePrompt}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empty">
                        {t.selectTimePrompt}
                      </SelectItem>
                      {availableEndTimes.map((val) => (
                        <SelectItem key={val} value={String(val)}>
                          {formatTime(val)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration and helper info */}
              {!bookingDate ? (
                <p id="booking-date-hint" className="text-[11px] text-[#8e879f] -mt-1 px-1">
                  {lang === 'ru' ? 'Сначала выберите дату.' : 'Please select a date first.'}
                </p>
              ) : startTime !== null && endTime !== null && endTime > startTime ? (
                <div id="booking-duration-hint" className="text-xs text-[#7560da] font-medium flex items-center justify-between -mt-1 px-1">
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
                <p id="booking-time-hint" className="text-[11px] text-[#8e879f] -mt-1 px-1">
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
              <span className="block text-xs font-medium text-[#6c647e] dark:text-muted-foreground mb-1.5">
                {t.peopleCountLabel}
              </span>
              <Select
                value={peopleCount !== null ? String(peopleCount) : 'empty'}
                onValueChange={(val) => {
                  if (val === 'empty' || !val) {
                    setPeopleCount(null);
                  } else {
                    setPeopleCount(Number(val));
                  }
                }}
              >
                <SelectTrigger id="booking-people-count-select" className="w-full h-10 bg-card">
                  <SelectValue placeholder={lang === 'ru' ? 'Выберите количество' : 'Select count'}>
                    <span className={peopleCount !== null ? '' : 'text-muted-foreground'}>
                      {peopleCount !== null
                        ? peopleCount
                        : lang === 'ru'
                        ? 'Выберите количество'
                        : 'Select count'}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">
                    {lang === 'ru' ? 'Выберите количество' : 'Select count'}
                  </SelectItem>
                  {Array.from({ length: Math.max(room.capacity, 1) }, (_, i) => i + 1).map((cnt) => (
                    <SelectItem key={cnt} value={String(cnt)}>
                      <span>{cnt}</span>
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
                placeholder={t.namePlaceholder || (lang === 'ru' ? 'Иван Иванов' : 'Alex Johnson')}
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
                value={purpose}
                onValueChange={(val) => {
                  if (val) handlePurposeChange(val);
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
                  <SelectItem value={otherPurposeLabel}>{otherPurposeLabel}</SelectItem>
                </SelectContent>
              </Select>

              {purpose === otherPurposeLabel && (
                <Input
                  id="booking-custom-purpose"
                  type="text"
                  placeholder={t.customPurposePlaceholder}
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  required
                  maxLength={500}
                  className="h-10"
                />
              )}
            </div>

            {/* Submit button */}
            <button
              id="booking-submit-button"
              type="submit"
              className="choose-button mt-1 cursor-pointer"
              disabled={
                pending || loading || Boolean(storageError) || !isScheduleLoaded(bookingDate) ||
                !userName.trim() ||
                !bookingDate ||
                peopleCount === null ||
                (!purpose || (purpose === otherPurposeLabel && !customPurpose.trim())) ||
                startTime === null ||
                endTime === null ||
                endTime - startTime < 30 ||
                endTime - startTime > 240
              }
            >
              {pending ? (lang === 'ru' ? 'Сохраняем…' : 'Saving…') : t.confirmBookingButton}
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
