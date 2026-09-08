'use client';

import { Info, TrendingUp, UserRound, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Translation } from '@/lib/translations';

type AdditionalInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t?: Translation;
};

export function AdditionalInfoDialog({ open, onOpenChange, t }: AdditionalInfoDialogProps) {
  const copy = t;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="additional-info-dialog w-[96vw] sm:max-w-[620px] md:max-w-[680px] p-6 sm:p-7 overflow-y-auto overflow-x-hidden max-h-[90vh]" showCloseButton={false}>
        <div className="additional-info-heading">
          <span><Info size={21} /></span>
          <div>
            <DialogTitle>{copy?.additionalInfo ?? 'Доп. информация'}</DialogTitle>
            <DialogDescription>
              {copy?.additionalInfoDescription ?? 'Как работает рейтинг и доступ к учебным пространствам'}
            </DialogDescription>
          </div>
        </div>
        <div className="additional-info-sections">
          <section>
            <h3><UserRound size={18} /> {copy?.ratingInfoTitle ?? 'Рейтинг пользователя'}</h3>
            <p>{copy?.ratingInfo ?? 'Начальный рейтинг ученика — 0. Завершённая бронь даёт +1 балл. Одна поздняя отмена в месяц бесплатна, а отмена более чем за 2 часа до начала не меняет рейтинг. Следующие поздние отмены снимают 2 балла.'}</p>
          </section>
          <section>
            <h3><TrendingUp size={18} /> {copy?.popularityInfoTitle ?? 'Доступ к пространствам'}</h3>
            <p>{copy?.popularityInfo ?? 'При отрицательном рейтинге часть самых востребованных пространств может быть временно недоступна.'}</p>
          </section>
          <section>
            <h3><Info size={18} /> {copy?.bookingRulesTitle ?? 'Правила бронирования'}</h3>
          <p>{copy?.bookingRules ?? 'У одного аккаунта может быть только одна активная бронь. Чтобы забронировать другое пространство, сначала отмените текущую бронь. У каждого пространства на выбранный слот может быть только один ответственный.'}</p>
          </section>
        </div>
        <button
          id="additional-info-close-button"
          type="button"
          className="choose-button cursor-pointer flex items-center justify-center gap-2"
          onClick={() => onOpenChange(false)}
        >
          {copy?.close ?? 'Закрыть'} <X size={17} />
        </button>
      </DialogContent>
    </Dialog>
  );
}
