'use client';

import { Info, TrendingUp, UserRound, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

type AdditionalInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdditionalInfoDialog({
  open,
  onOpenChange,
}: AdditionalInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="additional-info-dialog max-w-[580px] w-full p-6 sm:p-7 overflow-y-auto max-h-[90vh]"
        showCloseButton
      >
        <div className="additional-info-heading">
          <span>
            <Info size={21} />
          </span>
          <div>
            <DialogTitle>Доп. информация</DialogTitle>
            <DialogDescription>
              Как работает рейтинг и доступ к учебным пространствам
            </DialogDescription>
          </div>
        </div>
        <div className="additional-info-sections">
          <section>
            <h3>
              <UserRound size={18} /> Рейтинг пользователя
            </h3>
            <p>
              Начальный рейтинг ученика — 0. Завершённая бронь даёт +1 балл.
              Одна поздняя отмена в месяц бесплатна, а отмена более чем за 2
              часа до начала не меняет рейтинг. Следующие поздние отмены снимают
              2 балла.
            </p>
            <p>
              Рейтинг не блокирует аккаунт целиком. При отрицательном рейтинге
              ученику недоступны самые востребованные коворкинги, но менее
              востребованные пространства остаются доступны.
            </p>
          </section>
          <section>
            <h3>
              <TrendingUp size={18} /> Востребованность коворкингов
            </h3>
            <p>
              Некоторые пространства пользуются большим спросом. При
              отрицательном рейтинге часть самых востребованных комнат может
              быть временно недоступна, остальные остаются доступны.
            </p>
          </section>
          <section>
            <h3>
              <Info size={18} /> Правила бронирования
            </h3>
            <p>
              Один аккаунт может иметь только одну активную бронь одновременно.
              У одного коворкинга на выбранный слот может быть только один
              ответственный.
            </p>
          </section>
        </div>
        <button
          type="button"
          className="choose-button"
          onClick={() => onOpenChange(false)}
        >
          <X size={17} /> Закрыть
        </button>
      </DialogContent>
    </Dialog>
  );
}
