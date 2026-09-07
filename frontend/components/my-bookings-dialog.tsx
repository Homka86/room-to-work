'use client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUserBookings } from '@/lib/bookings';
import { RatingSummary } from '@/components/rating-summary';
import { BookingList } from '@/components/booking-list';
import { StorageStatus } from '@/components/storage-status';
import { type Translation, type Language, TRANSLATIONS } from '@/lib/translations';
export function MyBookingsDialog({ open, onOpenChange, onSelectRoom, lang = 'ru', t = TRANSLATIONS.ru }: {
  open: boolean; onOpenChange: (open: boolean) => void; onSelectRoom?: (roomId: number) => void; lang?: Language; t?: Translation;
}) {
  const { activeBookings, completedBookings, cancelledBookings, loading, error } = useUserBookings();
  const history = [...completedBookings, ...cancelledBookings].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="confirmation-dialog max-w-[560px] w-full p-6 overflow-y-auto max-h-[90vh]">
    <DialogTitle>{t.myBookings}</DialogTitle><DialogDescription>{lang === 'ru' ? 'Управление вашими бронированиями' : 'Manage your reservations'}</DialogDescription>
    <RatingSummary compact /><StorageStatus showTemporary />
    <Tabs defaultValue="active"><TabsList className="mb-4"><TabsTrigger value="active">{t.activeBookingTab} ({activeBookings.length})</TabsTrigger><TabsTrigger value="history">{t.historyTab} ({history.length})</TabsTrigger></TabsList>
      <TabsContent value="active"><BookingList bookings={activeBookings} lang={lang} t={t} onSelectRoom={onSelectRoom ? id => { onSelectRoom(id); onOpenChange(false); } : undefined} />{!loading && !error && !activeBookings.length && <p className="text-sm text-muted-foreground py-5">{t.noActiveBooking}</p>}</TabsContent>
      <TabsContent value="history"><BookingList bookings={history} lang={lang} t={t} />{!loading && !error && !history.length && <p className="text-sm text-muted-foreground py-5">{t.noHistory}</p>}</TabsContent>
    </Tabs>
  </DialogContent></Dialog>;
}
