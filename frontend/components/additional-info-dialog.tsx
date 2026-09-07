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
      <DialogContent className="additional-info-dialog max-w-[580px] w-full p-6 sm:p-7 overflow-y-auto max-h-[90vh]" showCloseButton>
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
            <p>{copy?.bookingRules ?? 'Один аккаунт может иметь только одну активную бронь одновременно. У каждого пространства на выбранный слот может быть только один ответственный.'}</p>
          </section>
        </div>
        <button type="button" className="choose-button" onClick={() => onOpenChange(false)}>
          <X size={17} /> {copy?.close ?? 'Закрыть'}
        </button>
      </DialogContent>
    </Dialog>
  );
}
