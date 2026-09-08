'use client';
import { useState } from 'react';
import { useCampusSnapshot, refreshCampus } from '@/lib/campus-store';
import { useCampusPreferences } from '@/hooks/use-campus-preferences';
import { Button } from '@/components/ui/button';
export function StorageStatus({ showTemporary = false }: { showTemporary?: boolean }) {
  const { loading, error, temporary } = useCampusSnapshot();
  const { lang } = useCampusPreferences();
  const [retrying, setRetrying] = useState(false);

  async function retry() {
    setRetrying(true);
    await refreshCampus();
    setRetrying(false);
  }

  if (loading) return <output className="text-sm text-muted-foreground my-3">{lang === 'ru' ? 'Загрузка бронирований…' : 'Loading reservations…'}</output>;
  if (error) return <div role="alert" className="my-3 rounded-xl border border-red-300 p-3 text-sm text-red-700 dark:text-red-300">{lang === 'ru' ? 'Не удалось обновить данные. Показана последняя сохранённая версия.' : 'Unable to refresh. Showing the last confirmed data.'} <Button type="button" variant="outline" disabled={retrying} onClick={() => void retry()}>{retrying ? (lang === 'ru' ? 'Пробуем…' : 'Retrying…') : (lang === 'ru' ? 'Повторить' : 'Retry')}</Button></div>;
  if (showTemporary && temporary) return <p className="text-xs text-muted-foreground my-3">{lang === 'ru' ? 'Временный профиль этого браузера. После подключения входа УрФУ бронирования будут доступны через университетский аккаунт. Пока не очищайте cookies: без них доступ к этому профилю потеряется.' : 'Temporary profile for this browser. University sign-in will be added later. Keep cookies to retain access to this profile.'}</p>;
  return null;
}
