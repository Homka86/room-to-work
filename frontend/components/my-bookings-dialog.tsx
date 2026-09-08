'use client';

import {
  Award,
  CalendarCheck,
  DoorOpen,
  GraduationCap,
  UserRound,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUserBookings } from '@/lib/bookings';
import { useUserProfile, formatRating, getFreeCancellationsLeft } from '@/lib/account';
import { RoleSelect } from '@/components/role-select';
import { BookingList } from '@/components/booking-list';
import { type Translation, type Language, TRANSLATIONS } from '@/lib/translations';

interface MyBookingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRoom?: (roomId: number) => void;
  lang?: Language;
  t?: Translation;
}

export function MyBookingsDialog({
  open,
  onOpenChange,
  onSelectRoom,
  lang = 'ru',
  t = TRANSLATIONS.ru,
}: MyBookingsDialogProps) {
  const { profile } = useUserProfile();
  const { activeBookings, completedBookings, cancelledBookings, loading } = useUserBookings();
  const freeCancellationsLeft = getFreeCancellationsLeft(profile);

  const history = [...completedBookings, ...cancelledBookings].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="additional-info-dialog w-[96vw] sm:max-w-[760px] md:max-w-[820px] p-5 sm:p-7 overflow-y-auto overflow-x-hidden max-h-[90vh]"
        showCloseButton={false}
      >
        {/* Header with rounded icon like photo 1 */}
        <div className="additional-info-heading">
          <span>
            <UserRound size={22} />
          </span>
          <div>
            <DialogTitle>{t.user}</DialogTitle>
            <DialogDescription>
              {lang === 'ru'
                ? 'Профиль пользователя, роль, рейтинг и история бронирований'
                : 'User profile, role, rating, and reservation history'}
            </DialogDescription>
          </div>
        </div>

        {/* User Role & Rating in 1 row */}
        <div className="additional-info-sections">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Role Card: icon, role label, and role toggle */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-2xl bg-accent text-primary flex items-center justify-center shrink-0">
                  <GraduationCap size={22} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">
                    {lang === 'ru' ? 'Роль' : 'Role'}
                  </div>
                </div>
              </div>
              <RoleSelect
                id="user-dialog-role-select"
                value={profile.role}
                labels={{ student: t.roleStudent, teacher: t.roleTeacher }}
              />
            </div>

            {/* Rating Card: icon, rating label and value + free cancellations */}
            <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-2xl bg-accent text-primary flex items-center justify-center shrink-0">
                  <Award size={22} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">
                    {t.ratingLabel}
                  </div>
                  <div className="text-sm font-normal font-sans leading-normal tracking-normal text-foreground flex items-baseline gap-1">
                    <span className="font-normal font-sans">{formatRating(profile.rating)}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {lang === 'ru'
                        ? profile.rating === 1
                          ? 'балл'
                          : 'баллов'
                        : profile.rating === 1
                        ? 'point'
                        : 'points'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Free cancellations count */}
              <div className="text-right shrink-0 pl-2 border-l border-border/70">
                <div className="text-[11px] text-muted-foreground font-medium whitespace-nowrap leading-tight">
                  {lang === 'ru' ? 'Бесплатные отмены' : 'Free cancellations'}
                </div>
                <div className="text-xs font-semibold text-foreground mt-0.5 whitespace-nowrap">
                  {lang === 'ru'
                    ? `${freeCancellationsLeft} в этом месяце`
                    : `${freeCancellationsLeft} this month`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings Tabs */}
        <div className="mt-2">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="user-bookings-tabs-list w-full grid grid-cols-2 p-1.5 rounded-2xl bg-[#e5e1eb] dark:bg-[#1e2029] border border-border/80 dark:border-transparent !h-12 mb-4 gap-1.5">
              <TabsTrigger
                value="active"
                className="user-bookings-tab cursor-pointer !h-9 rounded-xl flex items-center justify-center gap-2 px-3 text-xs sm:text-sm font-semibold transition-all select-none bg-transparent text-[#7a7786] dark:text-[#8e92a8] data-active:bg-card dark:data-active:bg-[#15161c] data-active:text-foreground dark:data-active:text-white data-active:shadow-sm data-active:font-bold hover:text-foreground"
              >
                <span className="whitespace-nowrap">{t.activeBookingTab}</span>
                <span className="user-bookings-badge min-w-[20px] h-5 px-1.5 rounded-full text-[11px] flex items-center justify-center font-bold bg-muted-foreground/15 dark:bg-[#2d303f] text-foreground dark:text-white shrink-0">
                  {activeBookings.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="user-bookings-tab cursor-pointer !h-9 rounded-xl flex items-center justify-center gap-2 px-3 text-xs sm:text-sm font-semibold transition-all select-none bg-transparent text-[#7a7786] dark:text-[#8e92a8] data-active:bg-card dark:data-active:bg-[#15161c] data-active:text-foreground dark:data-active:text-white data-active:shadow-sm data-active:font-bold hover:text-foreground"
              >
                <span className="whitespace-nowrap">{t.historyTab}</span>
                <span className="user-bookings-badge min-w-[20px] h-5 px-1.5 rounded-full text-[11px] flex items-center justify-center font-bold bg-muted-foreground/15 dark:bg-[#2d303f] text-foreground dark:text-white shrink-0">
                  {history.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-0 focus-visible:outline-none">
              {activeBookings.length > 0 ? (
                <BookingList
                  bookings={activeBookings}
                  lang={lang}
                  t={t}
                  onSelectRoom={
                    onSelectRoom
                      ? (id) => {
                          onSelectRoom(id);
                          onOpenChange(false);
                        }
                      : undefined
                  }
                />
              ) : (
                !loading && (
                  <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border bg-muted/20">
                    <DoorOpen size={28} className="mx-auto text-muted-foreground mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">{t.noActiveBooking}</p>
                  </div>
                )
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0 focus-visible:outline-none">
              {history.length > 0 ? (
                <BookingList bookings={history} lang={lang} t={t} />
              ) : (
                !loading && (
                  <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border bg-muted/20">
                    <CalendarCheck size={28} className="mx-auto text-muted-foreground mb-2 opacity-50" />
                    <p className="text-sm font-medium text-foreground">{t.noHistory}</p>
                  </div>
                )
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom close button with swapped icon and text: [Text] [Icon] */}
        <button
          id="user-dialog-close-button"
          type="button"
          className="choose-button cursor-pointer flex items-center justify-center gap-2 mt-4"
          onClick={() => onOpenChange(false)}
        >
          {t.close} <X size={17} />
        </button>
      </DialogContent>
    </Dialog>
  );
}
