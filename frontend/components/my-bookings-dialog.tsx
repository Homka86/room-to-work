'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  GraduationCap,
  History,
  ShieldAlert,
  Star,
  Trash2,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate, formatTime } from '@/lib/campus';
import { useUserBookings } from '@/lib/bookings';
import { formatRating, isStudentBlocked, useUserProfile } from '@/lib/account';

type MyBookingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRoom?: (roomId: number) => void;
};

export function MyBookingsDialog({
  open,
  onOpenChange,
  onSelectRoom,
}: MyBookingsDialogProps) {
  const {
    activeBooking,
    completedBookings,
    cancelledBookings,
    cancel,
    refresh,
  } = useUserBookings();
  const { profile } = useUserProfile();
  const isBlocked = isStudentBlocked(profile);

  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const historyBookings = [...completedBookings, ...cancelledBookings].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );

  function handleCancel(bookingId: string) {
    cancel(bookingId);
    setConfirmCancelId(null);
    refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="confirmation-dialog max-w-[560px] w-full p-6 sm:p-7 overflow-y-auto max-h-[90vh]"
        showCloseButton={true}
      >
        <div className="flex items-center gap-3 border-b border-[#ece7f6] pb-4">
          <div className="w-11 h-11 rounded-xl bg-[#f4f1fb] text-[#7560da] flex items-center justify-center shrink-0">
            <DoorOpen size={22} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-[#2a2d3c] m-0">
              Мои бронирования
            </DialogTitle>
            <DialogDescription className="text-xs text-[#777c8e] m-0">
              Управление вашими местами в кампусе
            </DialogDescription>
          </div>
        </div>

        <div
          id="my-bookings-rating-summary"
          className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
            isBlocked
              ? 'border-[#f5ccd2] bg-[#fff6f7]'
              : 'border-[#e4def2] bg-[#fbf9fe]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isBlocked
                  ? 'bg-[#fdeef0] text-[#b94a57]'
                  : 'bg-[#ede9fc] text-[#7560da]'
              }`}
            >
              {isBlocked ? <ShieldAlert size={18} /> : profile.role === 'student' ? <Star size={18} /> : <GraduationCap size={18} />}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#7560da]">
                {profile.role === 'student' ? 'Рейтинг ученика' : 'Преподаватель'}
              </div>
              <div className="text-[11px] text-[#777c8e]">
                {isBlocked
                  ? `Блокировка до ${formatDate(profile.blockedUntil!)}`
                  : profile.role === 'student'
                  ? 'Завершение +1 · одна отмена в месяц бесплатна · поздняя отмена −2'
                  : 'Рейтинг не влияет на доступ'}
              </div>
            </div>
          </div>

          <strong className={`text-sm ${isBlocked ? 'text-[#b94a57]' : 'text-[#7560da]'}`}>
            {profile.role === 'student' ? `${formatRating(profile.rating)} баллов` : 'Без ограничений'}
          </strong>
        </div>
        <p className="text-[11px] text-[#858a9c] m-0">
          Один аккаунт может отвечать только за один коворкинг в одно время.
        </p>

        <Tabs defaultValue="active" className="w-full">
          <TabsList id="my-bookings-tabs-list" className="w-full grid grid-cols-2 bg-[#f0f1f6] p-1 rounded-lg mb-4">
            <TabsTrigger
              id="my-bookings-tab-active"
              value="active"
              className="text-xs font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-[#2a2d3c] data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              Активная бронь
              {activeBooking && (
                <span className="w-2 h-2 rounded-full bg-[#278557]" />
              )}
            </TabsTrigger>
            <TabsTrigger
              id="my-bookings-tab-history"
              value="history"
              className="text-xs font-medium rounded-md data-[state=active]:bg-white data-[state=active]:text-[#2a2d3c] data-[state=active]:shadow-sm flex items-center justify-center gap-1.5"
            >
              История
              {historyBookings.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#e3e1ea] text-[#555]">
                  {historyBookings.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ACTIVE TAB */}
          <TabsContent value="active" className="mt-0 focus-visible:outline-none">
            {activeBooking ? (
              <div className="flex flex-col gap-4">
                <div id="my-bookings-active-card" className="border border-[#dfd6f2] bg-[#fbf9fe] rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs uppercase font-semibold tracking-wider text-[#7560da] mb-0.5">
                        {activeBooking.roomFloor} этаж · {activeBooking.roomKind}
                      </div>
                      <h3 className="text-2xl font-bold text-[#2a2d3c] m-0">
                        Коворкинг К{activeBooking.roomNumber}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf7ee] text-[#278557] flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      Активна
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-[#ece7f6] text-xs">
                    <div className="flex items-center gap-2 text-[#514a66]">
                      <Calendar size={15} className="text-[#8e879f]" />
                      <span className="font-medium">
                        {formatDate(activeBooking.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#514a66]">
                      <Clock size={15} className="text-[#8e879f]" />
                      <span className="font-medium">
                        {formatTime(activeBooking.startTime)} —{' '}
                        {formatTime(activeBooking.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#514a66]">
                      <User size={15} className="text-[#8e879f]" />
                      <span className="font-medium truncate">
                        {activeBooking.userName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#514a66]">
                      <Users size={15} className="text-[#8e879f]" />
                      <span>до {activeBooking.roomCapacity} мест</span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-[#6c647e]">
                    <span className="text-[#8e879f] block mb-0.5">Цель:</span>
                    <p className="font-medium text-[#2a2d3c] m-0 bg-white border border-[#eee8f8] p-2.5 rounded-lg">
                      {activeBooking.purpose}
                    </p>
                  </div>

                  {confirmCancelId === activeBooking.id ? (
                    <div id="my-bookings-confirm-cancel-box" className="mt-4 p-3.5 bg-[#fdeef0] border border-[#f5ccd2] rounded-xl flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-[#b94a57] font-semibold text-xs">
                        <AlertCircle size={15} />
                        Вы уверены, что хотите отменить эту бронь?
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="my-bookings-confirm-cancel-btn"
                          type="button"
                          className="flex-1 h-9 rounded-lg bg-[#b94a57] text-white text-xs font-semibold hover:bg-[#a33845] transition-colors"
                          onClick={() => handleCancel(activeBooking.id)}
                        >
                          Да, отменить
                        </button>
                        <button
                          id="my-bookings-abort-cancel-btn"
                          type="button"
                          className="h-9 px-3 rounded-lg border border-[#d8ccd3] bg-white text-[#555] text-xs font-medium hover:bg-[#f6f6f6] transition-colors"
                          onClick={() => setConfirmCancelId(null)}
                        >
                          Оставить
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <button
                        id="my-bookings-cancel-btn"
                        type="button"
                        className="flex-1 h-10 rounded-lg border border-[#cf414d] text-[#cf414d] hover:bg-[#fdeef0] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                        onClick={() => setConfirmCancelId(activeBooking.id)}
                      >
                        <Trash2 size={15} />
                        Отменить бронь
                      </button>
                      {onSelectRoom && (
                        <button
                          id="my-bookings-show-on-map-btn"
                          type="button"
                          className="h-10 px-3.5 rounded-lg border border-border bg-white text-[#2a2d3c] hover:bg-[#f0f1f6] text-xs font-medium transition-colors"
                          onClick={() => {
                            onSelectRoom(activeBooking.roomId);
                            onOpenChange(false);
                          }}
                        >
                          На схеме этажа
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div id="my-bookings-empty-state" className="py-10 px-4 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#f7f8fb] border border-dashed border-[#d8dae5] flex items-center justify-center text-[#9ea3b5]">
                  <DoorOpen size={28} />
                </div>
                <div>
                  <h4 className="font-semibold text-base text-[#2a2d3c] m-0 mb-1">
                    Нет активных бронирований
                  </h4>
                  <p className="text-xs text-[#858a9c] m-0 max-w-xs leading-relaxed">
                    Выберите свободный коворкинг на нужном этаже и нажмите
                    «Забронировать», чтобы оформить место.
                  </p>
                </div>
                <button
                  id="my-bookings-empty-choose-btn"
                  type="button"
                  className="choose-button max-w-[200px] h-9 text-xs mt-1"
                  onClick={() => onOpenChange(false)}
                >
                  Забронировать
                </button>
              </div>
            )}
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="mt-0 focus-visible:outline-none">
            {historyBookings.length > 0 ? (
              <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {historyBookings.map((item) => {
                  const isCompleted = item.status === 'completed';
                  return (
                    <div
                      key={item.id}
                      id={`my-bookings-history-item-${item.id}`}
                      className="border border-[#e7e9f1] rounded-xl p-3.5 bg-white hover:border-[#d9d5ea] transition-all flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm text-[#2a2d3c]">
                            Коворкинг К{item.roomNumber}{' '}
                            <span className="text-xs font-normal text-[#858a9c]">
                              ({item.roomFloor} этаж)
                            </span>
                          </div>
                          <div className="text-xs text-[#858a9c]">
                            {item.roomKind}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-[#f0f1f6] text-[#666c7f]'
                              : 'bg-[#fdeef0] text-[#b94a57]'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <History size={11} />
                              Завершена
                            </>
                          ) : (
                            <>
                              <XCircle size={11} />
                              Отменена
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#514a66] pt-1 border-t border-[#f4f4f7]">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-[#9ea3b5]" />
                          {formatDate(item.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-[#9ea3b5]" />
                          {formatTime(item.startTime)} —{' '}
                          {formatTime(item.endTime)}
                        </span>
                        <span className="text-[#888] truncate max-w-[200px]">
                          Цель: {item.purpose}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center gap-2">
                <History size={28} className="text-[#b4b9cc]" />
                <p className="text-xs text-[#858a9c] m-0">
                  История бронирований пока пуста
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
