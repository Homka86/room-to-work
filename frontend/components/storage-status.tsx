'use client';
import { useState } from 'react';
import { useCampusSnapshot, refreshCampus } from '@/lib/campus-store';
import { useCampusPreferences } from '@/hooks/use-campus-preferences';
import { Button } from '@/components/ui/button';
import type { Language, Translation } from '@/lib/translations';

export function StorageStatus({
  showTemporary = false,
  lang: propLang,
  t: propT,
}: {
  showTemporary?: boolean;
  lang?: Language;
  t?: Translation;
}) {
  const { loading, error, temporary } = useCampusSnapshot();
  const { lang: prefLang, t: prefT } = useCampusPreferences();
  const lang = propLang || prefLang;
  const t = propT || prefT;
  const [retrying, setRetrying] = useState(false);

  async function retry() {
    setRetrying(true);
    await refreshCampus();
    setRetrying(false);
  }

  if (loading) return <output className="text-sm text-muted-foreground my-3">{t?.syncLoading || (lang === 'ru' ? 'Загрузка бронирований…' : 'Loading reservations…')}</output>;
  if (error) {
    return (
      <div
        id="storage-sync-error-banner"
        role="alert"
        className="my-3 rounded-xl border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-3 flex-wrap"
      >
        <span>
          {t?.syncError || (lang === 'ru' ? 'Не удалось обновить данные. Показана последняя сохранённая версия.' : 'Failed to update data. Showing the latest saved version.')}
        </span>
        <Button
          id="storage-sync-retry-button"
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={retrying}
          onClick={() => void retry()}
        >
          {retrying
            ? (t?.syncErrorRetrying || (lang === 'ru' ? 'Пробуем…' : 'Retrying…'))
            : (t?.syncErrorRetry || (lang === 'ru' ? 'Повторить' : 'Retry'))}
        </Button>
      </div>
    );
  }
  if (showTemporary && temporary) {
    return (
      <p className="text-xs text-muted-foreground my-3">
        {lang === 'ru'
          ? 'Временный профиль этого браузера. После подключения входа УрФУ бронирования будут доступны через университетский аккаунт. Пока не очищайте cookies: без них доступ к этому профилю потеряется.'
          : 'Temporary profile for this browser. University sign-in will be added later. Keep cookies to retain access to this profile.'}
      </p>
    );
  }
  return null;
}
