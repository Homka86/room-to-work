'use client';

import { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  History,
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
import { RatingSummary } from '@/components/rating-summary';
import { type Translation, type Language, TRANSLATIONS } from '@/lib/translations';

type MyBookingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRoom?: (roomId: number) => void;
  lang?: Language;
  t?: Translation;
};

export function MyBookingsDialog({
  open,
  onOpenChange,
  onSelectRoom,
  lang = 'ru',
  t = TRANSLATIONS.ru,
}: MyBookingsDialogProps) {
  const {
    activeBooking,
    completedBookings,
    cancelledBookings,
    cancel,
    refresh,
  } = useUserBookings();

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
        <div className="flex items-center gap-3 border-b border-[#ece7f6] dark:border-border pb-4">
          <div className="w-11 h-11 rounded-xl bg-[#7560da] text-white dark:bg-white dark:text-[#7560da] flex items-center justify-center shrink-0 shadow-xs">
            <DoorOpen size={22} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-[#2a2d3c] dark:text-foreground m-0">
              {t.myBookings}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#777c8e] dark:text-muted-foreground m-0">
              {lang === 'ru'
                ? 'Управление вашими местами в кампусе'
                : 'Manage your campus reservations'}
            </DialogDescription>
          </div>
        </div>

        <div className="my-bookings-tools">
          <RatingSummary compact />
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList
            id="my-bookings-tabs-list"
            className="w-full grid grid-cols-2 h-10 p-1 gap-1 bg-muted rounded-xl border border-border mb-4"
          >
            <TabsTrigger
              id="my-bookings-tab-active"
              value="active"
              className="h-full rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-none text-muted-foreground data-active:bg-card data-active:text-foreground data-active:shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            >
              <span>{t.activeBookingTab}</span>
              {activeBooking && (
                <span className="w-2 h-2 rounded-full bg-[#278557] shrink-0" />
              )}
            </TabsTrigger>
            <TabsTrigger
              id="my-bookings-tab-history"
              value="history"
              className="h-full rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-none text-muted-foreground data-active:bg-card data-active:text-foreground data-active:shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            >
              <span>{t.historyTab}</span>
              {historyBookings.length > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted-foreground/15 text-muted-foreground">
                  {historyBookings.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ACTIVE TAB */}
          <TabsContent value="active" className="mt-0 focus-visible:outline-none">
            {activeBooking ? (
              <div className="flex flex-col gap-4">
                <div id="my-bookings-active-card" className="border border-[#dfd6f2] dark:border-border bg-[#fbf9fe] dark:bg-card rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-xs uppercase font-semibold tracking-wider text-[#7560da] mb-0.5">
                        {activeBooking.roomFloor} {t.floorWord} · {t.kinds[activeBooking.roomKind as keyof typeof t.kinds] || activeBooking.roomKind}
                      </div>
                      <h3 className="text-2xl font-bold text-[#2a2d3c] dark:text-foreground m-0">
                        {t.coworking} {activeBooking.roomNumber}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eaf7ee] text-[#278557] flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      {t.active}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-[#ece7f6] dark:border-border text-xs">
                    <div className="flex items-center gap-2 text-[#514a66] dark:text-foreground">
                      <Calendar size={15} className="text-[#8e879f]" />
                      <span className="font-medium">
                        {formatDate(activeBooking.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#514a66] dark:text-foreground">
                      <Clock size={15} className="text-[#8e879f]" />
                      <span className="font-medium">
                        {formatTime(activeBooking.startTime)} —{' '}
                        {formatTime(activeBooking.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#514a66] dark:text-foreground">
                      <User size={15} className="text-[#8e879f]" />
                      <span className="font-medium truncate">
                        {activeBooking.userName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[#514a66] dark:text-foreground">
                      <Users size={15} className="text-[#8e879f]" />
                      <span>
                        {activeBooking.attendees
                          ? `${activeBooking.attendees} ${
                              lang === 'ru'
                                ? activeBooking.attendees === 1
                                  ? 'человек'
                                  : activeBooking.attendees < 5
                                  ? 'человека'
                                  : 'человек'
                                : activeBooking.attendees === 1
                                ? 'person'
                                : 'people'
                            }`
                          : lang === 'ru'
                          ? `до ${activeBooking.roomCapacity} мест`
                          : `up to ${activeBooking.roomCapacity} seats`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-[#6c647e] dark:text-muted-foreground">
                    <span className="text-[#8e879f] block mb-0.5">{t.purpose}:</span>
                    <p className="font-medium text-[#2a2d3c] dark:text-foreground m-0 bg-white dark:bg-background border border-[#eee8f8] dark:border-border p-2.5 rounded-lg">
                      {activeBooking.purpose}
                    </p>
                  </div>

                  {confirmCancelId === activeBooking.id ? (
                    <div id="my-bookings-confirm-cancel-box" className="mt-4 p-3.5 bg-[#fdeef0] dark:bg-[#32171c] border border-[#f5ccd2] rounded-xl flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 text-[#b94a57] font-semibold text-xs">
                        <AlertCircle size={15} />
                        {t.confirmCancel}
                      </div>
                      <div className="flex gap-2">
                        <button
                          id="my-bookings-confirm-cancel-btn"
                          type="button"
                          className="flex-1 h-9 rounded-lg bg-[#b94a57] text-white text-xs font-semibold hover:bg-[#a33845] transition-colors cursor-pointer"
                          onClick={() => handleCancel(activeBooking.id)}
                        >
                          {lang === 'ru' ? 'Да, отменить' : 'Yes, cancel'}
                        </button>
                        <button
                          id="my-bookings-abort-cancel-btn"
                          type="button"
                          className="h-9 px-3 rounded-lg border border-[#d8ccd3] dark:border-border bg-white dark:bg-card text-[#555] dark:text-foreground text-xs font-medium hover:bg-[#f6f6f6] transition-colors cursor-pointer"
                          onClick={() => setConfirmCancelId(null)}
                        >
                          {lang === 'ru' ? 'Оставить' : 'Back'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <button
                        id="my-bookings-cancel-btn"
                        type="button"
                        className="flex-1 h-10 rounded-lg border border-[#cf414d] text-[#cf414d] hover:bg-[#fdeef0] dark:hover:bg-[#32171c] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        onClick={() => setConfirmCancelId(activeBooking.id)}
                      >
                        <Trash2 size={15} />
                        {t.cancelBooking}
                      </button>
                      {onSelectRoom && (
                        <button
                          id="my-bookings-show-on-map-btn"
                          type="button"
                          className="h-10 px-3.5 rounded-lg border border-border bg-white dark:bg-card text-[#2a2d3c] dark:text-foreground hover:bg-[#f0f1f6] dark:hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
                          onClick={() => {
                            onSelectRoom(activeBooking.roomId);
                            onOpenChange(false);
                          }}
                        >
                          {lang === 'ru' ? 'На схеме этажа' : 'Show on map'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div id="my-bookings-empty-state" className="py-10 px-4 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#f7f8fb] dark:bg-card border border-dashed border-[#d8dae5] dark:border-border flex items-center justify-center text-[#9ea3b5]">
                  <DoorOpen size={28} />
                </div>
                <div>
                  <h4 className="font-semibold text-base text-[#2a2d3c] dark:text-foreground m-0 mb-1">
                    {t.noActiveBooking}
                  </h4>
                  <p className="text-xs text-[#858a9c] dark:text-muted-foreground m-0 max-w-xs leading-relaxed">
                    {t.noActiveBookingHint}
                  </p>
                </div>
                <button
                  id="my-bookings-empty-choose-btn"
                  type="button"
                  className="choose-button w-auto min-w-[240px] px-6 h-10 text-xs mt-1 cursor-pointer whitespace-nowrap"
                  onClick={() => onOpenChange(false)}
                >
                  {t.chooseCoworking}
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
                      className="border border-[#e7e9f1] dark:border-border rounded-xl p-3.5 bg-white dark:bg-card hover:border-[#d9d5ea] transition-all flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm text-[#2a2d3c] dark:text-foreground">
                            {t.coworking} {item.roomNumber}{' '}
                            <span className="text-xs font-normal text-[#858a9c] dark:text-muted-foreground">
                              ({item.roomFloor} {t.floorWord})
                            </span>
                          </div>
                          <div className="text-xs text-[#858a9c] dark:text-muted-foreground">
                            {t.kinds[item.roomKind as keyof typeof t.kinds] || item.roomKind}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-[#f0f1f6] dark:bg-muted text-[#666c7f] dark:text-muted-foreground'
                              : 'bg-[#fdeef0] dark:bg-[#32171c] text-[#b94a57]'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <History size={11} />
                              {t.completed}
                            </>
                          ) : (
                            <>
                              <XCircle size={11} />
                              {t.cancelled}
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#514a66] dark:text-foreground pt-1 border-t border-[#f4f4f7] dark:border-border">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-[#9ea3b5]" />
                          {formatDate(item.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-[#9ea3b5]" />
                          {formatTime(item.startTime)} —{' '}
                          {formatTime(item.endTime)}
                        </span>
                        <span className="text-[#888] dark:text-muted-foreground truncate max-w-[200px]">
                          {t.purpose}: {item.purpose}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center gap-2">
                <History size={28} className="text-[#b4b9cc]" />
                <p className="text-xs text-[#858a9c] dark:text-muted-foreground m-0">
                  {t.noHistory}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
