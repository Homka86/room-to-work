'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  DoorOpen,
  Info,
  ShieldAlert,
  Trash2,
  User,
  Users,
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
import { TIME_OPTIONS, formatTime, formatDate, type Room } from '@/lib/campus';
import {
  useUserBookings,
  evaluateBookingPermission,
  createNewBooking,
  formatBookingDuration,
  getCancellationMessage,
  getCancellationOutcome,
  POPULAR_PURPOSES,
  type UserBooking,
} from '@/lib/bookings';
import { formatRating, isStudentBlocked, useUserProfile } from '@/lib/account';

type BookingDialogProps = {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  selectedTime: number;
  onOpenMyBookings?: () => void;
  onSuccess?: (booking: UserBooking) => void;
};

export function BookingDialog({
  room,
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  onOpenMyBookings,
  onSuccess,
}: BookingDialogProps) {
  const { activeBooking, cancel, refresh } = useUserBookings(
    selectedDate,
    selectedTime,
  );
  const { profile } = useUserProfile();
  const isBlocked = isStudentBlocked(profile);
  const cancellationOutcome = activeBooking
    ? getCancellationOutcome(activeBooking, selectedDate, selectedTime)
    : null;

  const [userName, setUserName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  // Empty slot is at the top and selected by default
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<UserBooking | null>(
    null,
  );
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!room) return null;

  const permission = evaluateBookingPermission(
    room.id,
    selectedDate,
    selectedTime,
  );
  const isThisRoomBookedByMe = permission.isSameRoomBooked && activeBooking;
  const isAnotherRoomBookedByMe =
    !permission.allowed && !permission.isSameRoomBooked && activeBooking;

  // Available end times: min 30 min, max 4 hours (240 min), up to campus closing (22:00 = 1320 min)
  const availableEndTimes: number[] = [];
  if (startTime !== null) {
    const minEnd = startTime + 30;
    const maxEnd = Math.min(startTime + 240, 1320);
    for (let t = minEnd; t <= maxEnd; t += 30) {
      availableEndTimes.push(t);
    }
  }

  function handleStartTimeChange(value: string) {
    if (value === 'empty' || !value) {
      setStartTime(null);
      setEndTime(null);
      return;
    }

    const nextStart = Number(value);
    setStartTime(nextStart);

    // If both times were chosen and person changes start:
    if (endTime !== null) {
      const diff = endTime - nextStart;
      // If booking duration exceeds 4 hours (240 min)
      if (diff > 240) {
        setEndTime(Math.min(nextStart + 240, 1320));
      }
      // If booking duration is less than minimum 30 minutes (or end is before/equal start)
      else if (diff < 30) {
        setEndTime(Math.min(nextStart + 30, 1320));
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

  function handlePurposeChange(value: string) {
    setPurpose(value);
    if (value !== 'Другая цель') {
      setCustomPurpose('');
    }
  }

  function handleBookingSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!room) return;
    if (startTime === null || endTime === null) {
      setErrorMsg(
        'Пожалуйста, выберите время начала и окончания бронирования.',
      );
      return;
    }
    setErrorMsg(null);

    const finalPurpose =
      purpose === 'Другая цель' ? customPurpose.trim() : purpose;

    const result = createNewBooking({
      room,
      date: selectedDate,
      startTime,
      endTime,
      userName,
      purpose: finalPurpose,
    });

    if (!result.success) {
      setErrorMsg(result.error ?? 'Произошла ошибка при бронировании');
      return;
    }

    refresh();
    setIsSuccess(true);
    setCreatedBooking(result.booking ?? null);
    if (result.booking && onSuccess) {
      onSuccess(result.booking);
    }
  }

  function handleCancelBooking() {
    if (!activeBooking) return;
    const res = cancel(activeBooking.id);
    if (res.success) {
      setConfirmCancel(false);
      onOpenChange(false);
    } else {
      setErrorMsg(res.error ?? 'Не удалось отменить бронь');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setIsSuccess(false);
          setCreatedBooking(null);
          setErrorMsg(null);
          setConfirmCancel(false);
          setStartTime(null);
          setEndTime(null);
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
            <DialogTitle className="confirmation-title text-2xl font-bold text-foreground">
              Коворкинг забронирован!
            </DialogTitle>
            <DialogDescription className="confirmation-description text-muted-foreground text-base">
              Ждём вас в коворкинге{' '}
              <strong className="text-foreground">К{room.number}</strong> (
              {room.floor} этаж)
            </DialogDescription>

            <div className="w-full bg-[#f8f6fc] border border-border rounded-xl p-4 text-left flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between items-center text-urfu-blue font-medium border-b border-border pb-2">
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} />
                  {formatDate(createdBooking.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} />
                  {formatTime(createdBooking.startTime)} —{' '}
                  {formatTime(createdBooking.endTime)}
                </span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-muted-foreground text-xs block">
                  Имя:
                </span>
                <span className="font-medium">{createdBooking.userName}</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-muted-foreground text-xs block">
                  Цель:
                </span>
                <span className="font-medium">{createdBooking.purpose}</span>
              </div>
            </div>

            <div className="confirmation-note text-left w-full">
              <Info size={18} />
              <span>
                Бронь закреплена за вами. Если планы изменятся, вы можете
                отменить её в любой момент в «Моих бронированиях».
              </span>
            </div>

            <button
              id="booking-success-close-button"
              type="button"
              className="choose-button mt-2"
              onClick={() => onOpenChange(false)}
            >
              Отлично, понятно
              <Check size={18} />
            </button>
          </div>
        ) : isThisRoomBookedByMe ? (
          /* Already Booked by Current User: Room Cancellation State */
          <div
            id="booking-active-room-view"
            className="flex flex-col gap-4 py-1"
          >
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-12 h-12 rounded-xl bg-[#eaf7ee] text-[#278557] flex items-center justify-center shrink-0">
                <DoorOpen size={24} />
              </div>
              <div>
                <DialogTitle
                  id="booking-active-dialog-title"
                  className="text-xl font-bold text-foreground m-0"
                >
                  Ваша активная бронь
                </DialogTitle>
                <DialogDescription
                  id="booking-active-dialog-desc"
                  className="text-sm text-muted-foreground m-0"
                >
                  Коворкинг К{room.number} · {room.floor} этаж · {room.kind}
                </DialogDescription>
              </div>
            </div>

            <div
              id="booking-active-details-card"
              className="bg-muted border border-border rounded-xl p-4 flex flex-col gap-3 text-sm"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar size={15} />
                  Дата
                </span>
                <strong className="text-foreground">
                  {formatDate(activeBooking.date)}
                </strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock size={15} />
                  Время
                </span>
                <strong className="text-urfu-blue">
                  {formatTime(activeBooking.startTime)} —{' '}
                  {formatTime(activeBooking.endTime)} (
                  {formatBookingDuration(
                    activeBooking.startTime,
                    activeBooking.endTime,
                  )}
                  )
                </strong>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User size={15} />
                  Имя
                </span>
                <strong className="text-foreground">
                  {activeBooking.userName}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Цель</span>
                <strong className="text-foreground text-right max-w-[240px] truncate">
                  {activeBooking.purpose}
                </strong>
              </div>
            </div>

            {confirmCancel ? (
              <div
                id="booking-cancel-confirm-box"
                className="bg-[#fdeef0] border border-[#f5ccd2] rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 text-[#b94a57] font-semibold text-sm">
                  <AlertCircle size={17} />
                  Подтвердите отмену бронирования
                </div>
                <p className="text-xs text-[#7e4750] m-0 leading-relaxed">
                  Помещение снова станет доступным для всех студентов и команд
                  кампуса.
                </p>
                {cancellationOutcome && (
                  <p className="text-xs text-[#7e4750] m-0 leading-relaxed">
                    {getCancellationMessage(cancellationOutcome)}
                  </p>
                )}
                <div className="flex gap-2 mt-1">
                  <button
                    id="booking-confirm-cancel-button"
                    type="button"
                    className="flex-1 h-10 rounded-lg bg-[#b94a57] text-white text-sm font-medium hover:bg-[#a33845] transition-colors"
                    onClick={handleCancelBooking}
                  >
                    Да, отменить бронь
                  </button>
                  <button
                    id="booking-abort-cancel-button"
                    type="button"
                    className="h-10 px-4 rounded-lg border border-[#d8ccd3] bg-white text-[#555] text-sm font-medium hover:bg-[#f6f6f6] transition-colors"
                    onClick={() => setConfirmCancel(false)}
                  >
                    Назад
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <button
                  id="booking-start-cancel-button"
                  type="button"
                  className="h-11 w-full rounded-lg border border-[#cf414d] text-[#cf414d] hover:bg-[#fdeef0] font-medium text-sm transition-colors flex items-center justify-center gap-2"
                  onClick={() => setConfirmCancel(true)}
                >
                  <Trash2 size={16} />
                  Отменить бронь
                </button>
                <button
                  id="booking-keep-active-button"
                  type="button"
                  className="choose-button"
                  onClick={() => onOpenChange(false)}
                >
                  Оставить бронь активной
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
              <DialogTitle
                id="booking-conflict-title"
                className="text-xl font-bold text-foreground mb-1"
              >
                У вас уже есть бронирование
              </DialogTitle>
              <DialogDescription
                id="booking-conflict-desc"
                className="text-sm text-muted-foreground"
              >
                По правилам кампуса разрешено иметь только одну активную бронь
                одновременно.
              </DialogDescription>
            </div>

            <div
              id="booking-conflict-details-card"
              className="bg-[#fff9ea] border border-[#f5e3b5] rounded-xl p-4 text-sm flex flex-col gap-2 text-[#795411]"
            >
              <div className="font-semibold flex items-center gap-1.5">
                <DoorOpen size={16} />
                Текущая бронь: Коворкинг К{activeBooking.roomNumber} (
                {activeBooking.roomFloor} этаж)
              </div>
              <div className="text-xs text-[#8f6d2b]">
                {formatDate(activeBooking.date)} ·{' '}
                {formatTime(activeBooking.startTime)} —{' '}
                {formatTime(activeBooking.endTime)}
              </div>
              <div className="text-xs text-[#8f6d2b]">
                Цель: {activeBooking.purpose}
              </div>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed">
              Чтобы забронировать коворкинг{' '}
              <strong className="text-foreground">К{room.number}</strong>,
              сначала отмените текущую бронь.
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                id="booking-conflict-cancel-prev-button"
                type="button"
                className="h-11 w-full rounded-lg border border-[#b94a57] text-[#b94a57] hover:bg-[#fdeef0] font-medium text-sm transition-colors flex items-center justify-center gap-2"
                onClick={() => {
                  cancel(activeBooking.id);
                  refresh();
                }}
              >
                <Trash2 size={16} />
                Отменить бронь К{activeBooking.roomNumber}
              </button>
              {onOpenMyBookings && (
                <button
                  id="booking-conflict-goto-mybookings-button"
                  type="button"
                  className="choose-button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenMyBookings();
                  }}
                >
                  Перейти в «Мои бронирования»
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        ) : isBlocked ? (
          <div id="booking-blocked-view" className="flex flex-col gap-4 py-1">
            <div className="flex items-center gap-3 border-b border-[#f5ccd2] pb-4">
              <div className="w-12 h-12 rounded-xl bg-[#fdeef0] text-[#b94a57] flex items-center justify-center shrink-0">
                <ShieldAlert size={25} />
              </div>
              <div>
                <DialogTitle
                  id="booking-blocked-title"
                  className="text-xl font-bold text-foreground m-0"
                >
                  Бронирование временно недоступно
                </DialogTitle>
                <DialogDescription
                  id="booking-blocked-desc"
                  className="text-sm text-muted-foreground m-0"
                >
                  Рейтинг ученика достиг критического значения.
                </DialogDescription>
              </div>
            </div>

            <div className="bg-[#fff6f7] border border-[#f5ccd2] rounded-xl p-4 text-sm text-[#8f323c] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Ваш рейтинг</span>
                <strong>{formatRating(profile.rating)} баллов</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Доступ вернётся</span>
                <strong>{formatDate(profile.blockedUntil!)}</strong>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              За завершённую бронь начисляется +1 балл, за отмену списывается
              −2. При рейтинге −3 и ниже бронирование блокируется на 7 дней.
            </p>

            <button
              id="booking-blocked-close-button"
              type="button"
              className="choose-button mt-1"
              onClick={() => onOpenChange(false)}
            >
              Понятно
              <Check size={18} />
            </button>
          </div>
        ) : (
          /* Normal Booking Form */
          <form
            id="new-booking-form"
            onSubmit={handleBookingSubmit}
            className="flex flex-col gap-4"
          >
            {/* Header info */}
            <div className="border-b border-border pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-urfu-blue">
                  Бронирование пространства
                </span>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Users size={13} />
                  до {room.capacity} человек
                </span>
              </div>
              <DialogTitle className="text-2xl font-bold text-foreground mt-1 mb-0.5">
                Коворкинг К{room.number}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {room.floor} этаж · {room.kind}
              </DialogDescription>
            </div>

            {errorMsg && (
              <div className="bg-[#fdeef0] border border-[#f5ccd2] text-[#cf414d] text-xs p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Date & Time fields */}
            <div className="flex flex-col gap-3">
              <div>
                <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Дата посещения
                </span>
                <div className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-input bg-muted text-sm text-foreground">
                  <Calendar size={16} className="text-muted-foreground" />
                  <span className="font-medium">
                    {formatDate(selectedDate)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Начало
                  </span>
                  <Select
                    value={startTime !== null ? String(startTime) : 'empty'}
                    onValueChange={(val) => {
                      if (val) handleStartTimeChange(val);
                    }}
                  >
                    <SelectTrigger
                      id="booking-start-time-select"
                      className="w-full h-10 bg-card"
                    >
                      <SelectValue placeholder="—:—">
                        {startTime !== null ? formatTime(startTime) : '—:—'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empty">—:—</SelectItem>
                      {TIME_OPTIONS.map((val) => (
                        <SelectItem key={val} value={String(val)}>
                          {formatTime(val)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Окончание
                  </span>
                  <Select
                    value={endTime !== null ? String(endTime) : 'empty'}
                    onValueChange={(val) => {
                      if (val) handleEndTimeChange(val);
                    }}
                    disabled={startTime === null}
                  >
                    <SelectTrigger
                      id="booking-end-time-select"
                      className="w-full h-10 bg-card"
                    >
                      <SelectValue placeholder="—:—">
                        {endTime !== null ? formatTime(endTime) : '—:—'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empty">—:—</SelectItem>
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
              {startTime !== null && endTime !== null && endTime > startTime ? (
                <div
                  id="booking-duration-hint"
                  className="text-xs text-urfu-blue font-medium flex items-center justify-between -mt-1 px-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>
                      Длительность:{' '}
                      <strong>
                        {formatBookingDuration(startTime, endTime)}
                      </strong>
                    </span>
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    от 30 мин до 4 ч
                  </span>
                </div>
              ) : (
                <p
                  id="booking-time-hint"
                  className="text-[11px] text-muted-foreground -mt-1 px-1"
                >
                  {startTime === null
                    ? 'Сначала выберите время начала.'
                    : 'Выберите время окончания (от 30 мин до 4 часов).'}
                </p>
              )}
            </div>

            {/* Name input */}
            <div>
              <label
                htmlFor="booking-user-name"
                className="block text-xs font-medium text-muted-foreground mb-1.5"
              >
                Ваше имя и фамилия <span className="text-[#cf414d]">*</span>
              </label>
              <Input
                id="booking-user-name"
                type="text"
                placeholder="Например, Анна Соколова"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="h-10"
              />
            </div>

            {/* Purpose input */}
            <div>
              <span className="block text-xs font-medium text-muted-foreground mb-1.5">
                Цель бронирования <span className="text-[#cf414d]">*</span>
              </span>
              <Select
                value={purpose}
                onValueChange={(val) => {
                  if (val) handlePurposeChange(val);
                }}
              >
                <SelectTrigger
                  id="booking-purpose-select"
                  className="w-full h-10 bg-card mb-2"
                >
                  <SelectValue placeholder="Выберите цель посещения">
                    {purpose || 'Выберите цель посещения'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_PURPOSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                  <SelectItem value="Другая цель">Другая цель</SelectItem>
                </SelectContent>
              </Select>

              {purpose === 'Другая цель' && (
                <Input
                  id="booking-custom-purpose"
                  type="text"
                  placeholder="Опишите вашу цель"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  required
                  className="h-10"
                />
              )}
            </div>

            {/* Policy note */}
            <div
              id="booking-rules-note"
              className="bg-accent border border-border rounded-lg p-2.5 text-xs text-muted-foreground flex items-center gap-2"
            >
              <Info size={15} className="shrink-0 text-urfu-blue" />
              <span>
                {profile.role === 'student'
                  ? `Рейтинг: ${formatRating(profile.rating)}. Завершение +1, одна отмена в месяц бесплатна, отмена более чем за 2 часа без штрафа. Один аккаунт = один активный коворкинг.`
                  : 'Роль преподавателя: рейтинг не влияет на бронирование. Один аккаунт = один активный коворкинг; один коворкинг = один ответственный.'}
              </span>
            </div>

            {/* Submit button */}
            <button
              id="booking-submit-button"
              type="submit"
              className="choose-button mt-1 cursor-pointer"
              disabled={
                !userName.trim() ||
                !purpose ||
                (purpose === 'Другая цель' && !customPurpose.trim()) ||
                startTime === null ||
                endTime === null ||
                endTime - startTime < 30 ||
                endTime - startTime > 240
              }
            >
              Забронировать коворкинг
              <ArrowRight size={18} />
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
