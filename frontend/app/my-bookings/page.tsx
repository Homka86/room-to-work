'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  DoorOpen,
  History,
  Layers3,
  Trash2,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate, formatTime } from '@/lib/campus';
import {
  useUserBookings,
  formatBookingDuration,
} from '@/lib/bookings';

export default function MyBookingsPage() {
  const {
    activeBooking,
    completedBookings,
    cancelledBookings,
    cancel,
    refresh,
  } = useUserBookings();

  const [confirmCancel, setConfirmCancel] = useState(false);

  const historyBookings = [...completedBookings, ...cancelledBookings].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );

  function handleCancelActive() {
    if (!activeBooking) return;
    cancel(activeBooking.id);
    setConfirmCancel(false);
    refresh();
  }

  return (
    <div className="site-shell">
      {/* Topbar matching exact design */}
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Есть место — главная">
          <span className="brand-icon">
            <DoorOpen size={24} strokeWidth={2.4} />
          </span>
          <span>
            есть место<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="header-location">
          <Building2 size={17} />
          <span>Университетский кампус</span>
          <span className="header-separator" />
          <span className="muted">3 этажа · 23 коворкинга</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-medium text-[#7560da] hover:text-[#5c49b8] px-3 py-1.5 rounded-lg border border-[#e8e2f6] bg-[#f4f1fb] transition-colors"
          >
            <DoorOpen size={14} />
            Все коворкинги
          </Link>
          <span className="demo-pill">
            <span />
            Демо-версия
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="workspace">
        <div className="breadcrumb">
          <Link href="/" className="hover:underline">
            Кампус
          </Link>
          <ChevronRight size={14} />
          <Link href="/" className="hover:underline">
            Коворкинги
          </Link>
          <ChevronRight size={14} />
          <span>Мои бронирования</span>
        </div>

        <div className="page-heading">
          <div>
            <h1>Мои бронирования</h1>
            <p>Текущие и завершённые бронирования коворкингов в кампусе.</p>
          </div>
          <div className="campus-stamp">
            <Layers3 size={21} />
            <span>
              Один кампус.
              <br />
              <strong>23 возможности.</strong>
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-6">
          <Tabs defaultValue="active" className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e9f1] pb-3 mb-6">
              <TabsList className="bg-[#f0f1f6] p-1 rounded-xl h-11">
                <TabsTrigger
                  value="active"
                  className="px-5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2a2d3c] data-[state=active]:shadow-sm flex items-center gap-2 transition-all"
                >
                  Активная бронь
                  {activeBooking ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#278557] text-white">
                      1
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#d5d7e2] text-[#6c647e]">
                      0
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="px-5 py-2 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#2a2d3c] data-[state=active]:shadow-sm flex items-center gap-2 transition-all"
                >
                  История
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#d5d7e2] text-[#6c647e]">
                    {historyBookings.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              <div className="text-xs text-[#858a9c] flex items-center gap-1.5">
                <AlertCircle size={14} className="text-[#7560da]" />
                <span>
                  Правило: один аккаунт — один активный коворкинг и один ответственный на коворкинг
                </span>
              </div>
            </div>

            {/* TAB: ACTIVE */}
            <TabsContent value="active" className="focus-visible:outline-none">
              {activeBooking ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Active Card Main */}
                  <div className="lg:col-span-2 border border-[#dfd6f2] bg-white rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#7560da]">
                          {activeBooking.roomFloor} этаж · {activeBooking.roomKind}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#eaf7ee] text-[#278557] flex items-center gap-1.5">
                          <CheckCircle2 size={14} />
                          Активное бронирование
                        </span>
                      </div>

                      <h2 className="text-3xl font-bold text-[#2a2d3c] mb-2">
                        Коворкинг К{activeBooking.roomNumber}
                      </h2>
                      <p className="text-sm text-[#777c8e] mb-6">
                        Пространство на {activeBooking.roomFloor} этаже кампуса
                        вместимостью до {activeBooking.roomCapacity} мест.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#fbf9fe] border border-[#eee7f8] mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#ede9fc] text-[#7560da] flex items-center justify-center shrink-0">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <div className="text-xs text-[#8e879f]">
                              Дата бронирования
                            </div>
                            <div className="text-sm font-semibold text-[#2a2d3c]">
                              {formatDate(activeBooking.date)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#ede9fc] text-[#7560da] flex items-center justify-center shrink-0">
                            <Clock size={18} />
                          </div>
                          <div>
                            <div className="text-xs text-[#8e879f]">
                              Время посещения
                            </div>
                            <div className="text-sm font-semibold text-[#2a2d3c]">
                              {formatTime(activeBooking.startTime)} —{' '}
                              {formatTime(activeBooking.endTime)}{' '}
                              <span className="text-xs font-normal text-[#8e879f]">
                                (
                                {formatBookingDuration(
                                  activeBooking.startTime,
                                  activeBooking.endTime,
                                )}
                                )
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#ede9fc] text-[#7560da] flex items-center justify-center shrink-0">
                            <User size={18} />
                          </div>
                          <div>
                            <div className="text-xs text-[#8e879f]">
                              Забронировано на имя
                            </div>
                            <div className="text-sm font-semibold text-[#2a2d3c]">
                              {activeBooking.userName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#ede9fc] text-[#7560da] flex items-center justify-center shrink-0">
                            <Users size={18} />
                          </div>
                          <div>
                            <div className="text-xs text-[#8e879f]">
                              Вместимость коворкинга
                            </div>
                            <div className="text-sm font-semibold text-[#2a2d3c]">
                              до {activeBooking.roomCapacity} человек
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-[#8e879f] block mb-1 font-medium">
                          Цель бронирования:
                        </span>
                        <div className="p-3.5 rounded-xl bg-white border border-[#e8e9f2] text-sm text-[#2a2d3c] font-medium">
                          {activeBooking.purpose}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-[#ece7f6]">
                      {confirmCancel ? (
                        <div className="p-4 bg-[#fdeef0] border border-[#f5ccd2] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 text-[#b94a57] text-sm font-medium">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>
                              Вы точно хотите отменить бронь коворкинга К
                              {activeBooking.roomNumber}?
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              className="h-9 px-4 rounded-lg bg-[#b94a57] text-white text-xs font-semibold hover:bg-[#a33845] transition-colors"
                              onClick={handleCancelActive}
                            >
                              Да, отменить
                            </button>
                            <button
                              type="button"
                              className="h-9 px-3 rounded-lg border border-[#d8ccd3] bg-white text-[#555] text-xs font-medium hover:bg-[#f6f6f6] transition-colors"
                              onClick={() => setConfirmCancel(false)}
                            >
                              Оставить
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <button
                            type="button"
                            className="h-11 px-6 rounded-xl border border-[#cf414d] text-[#cf414d] hover:bg-[#fdeef0] text-sm font-semibold transition-colors flex items-center gap-2"
                            onClick={() => setConfirmCancel(true)}
                          >
                            <Trash2 size={16} />
                            Отменить бронь
                          </button>
                          <Link
                            href="/"
                            className="h-11 px-5 rounded-xl border border-border bg-[#f7f8fb] text-[#2a2d3c] hover:bg-[#ede9fc] text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            Посмотреть на карте
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar Guidelines */}
                  <div className="flex flex-col gap-4">
                    <div className="bg-white border border-[#e7e9f1] rounded-2xl p-6">
                      <h3 className="text-base font-bold text-[#2a2d3c] mb-3">
                        Правила посещения
                      </h3>
                      <ul className="text-xs text-[#6c647e] space-y-3 pl-4 list-disc leading-relaxed">
                        <li>
                          Пожалуйста, освободите помещение вовремя для следующих
                          студентов.
                        </li>
                        <li>
                          Соблюдайте правила тишины в зоне тихого коворкинга.
                        </li>
                        <li>
                          Если ваши планы изменились, отмените бронь, чтобы место
                          стало доступно другим.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#ede9fc] border border-[#dfd6f2] rounded-2xl p-6 text-[#514a66]">
                      <h3 className="text-base font-bold text-[#7560da] mb-2 flex items-center gap-2">
                        <Building2 size={18} />
                        О коворкингах кампуса
                      </h3>
                      <p className="text-xs leading-relaxed mb-4">
                        23 пространства на 3 этажах созданы для удобной учёбы,
                        работы над проектами и встреч.
                      </p>
                      <Link
                        href="/"
                        className="text-xs font-semibold text-[#7560da] hover:underline flex items-center gap-1"
                      >
                        Вернуться к выбору коворкинга
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Active State */
                <div className="border border-dashed border-[#d8dae5] bg-white rounded-2xl p-12 text-center flex flex-col items-center gap-4 max-w-xl mx-auto my-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#f7f8fb] border border-[#e7e9f1] flex items-center justify-center text-[#9ea3b5]">
                    <DoorOpen size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#2a2d3c] mb-1.5">
                      У вас нет активного бронирования
                    </h3>
                    <p className="text-sm text-[#858a9c] max-w-md leading-relaxed">
                      Выберите свободный коворкинг на первом, втором или третьем
                      этаже, чтобы зарезервировать его для учёбы или встречи.
                    </p>
                  </div>
                  <Link
                    href="/"
                    className="choose-button max-w-[240px] mt-2 no-underline text-center"
                  >
                    Выбрать коворкинг
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </TabsContent>

            {/* TAB: HISTORY */}
            <TabsContent value="history" className="focus-visible:outline-none">
              {historyBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historyBookings.map((item) => {
                    const isCompleted = item.status === 'completed';
                    return (
                      <div
                        key={item.id}
                        className="border border-[#e7e9f1] bg-white rounded-2xl p-5 hover:border-[#dfd6f2] transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-xs text-[#858a9c] block font-medium">
                                {item.roomFloor} этаж · {item.roomKind}
                              </span>
                              <h4 className="text-lg font-bold text-[#2a2d3c] m-0">
                                Коворкинг К{item.roomNumber}
                              </h4>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                isCompleted
                                  ? 'bg-[#f0f1f6] text-[#666c7f]'
                                  : 'bg-[#fdeef0] text-[#b94a57]'
                              }`}
                            >
                              {isCompleted ? (
                                <>
                                  <History size={12} />
                                  Завершена
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} />
                                  Отменена
                                </>
                              )}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-[#514a66] my-3 pt-3 border-t border-[#f4f5f8]">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-[#9ea3b5]" />
                              <span>{formatDate(item.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-[#9ea3b5]" />
                              <span>
                                {formatTime(item.startTime)} —{' '}
                                {formatTime(item.endTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-[#9ea3b5]" />
                              <span>{item.userName}</span>
                            </div>
                          </div>

                          <div className="text-xs text-[#6c647e] bg-[#f9fafc] p-2.5 rounded-lg border border-[#f0f1f6]">
                            <span className="text-[#9ea3b5] block text-[11px] mb-0.5">
                              Цель:
                            </span>
                            <span className="font-medium">{item.purpose}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-[#e7e9f1] bg-white rounded-2xl p-12 text-center flex flex-col items-center gap-3 max-w-md mx-auto my-8">
                  <History size={36} className="text-[#b4b9cc]" />
                  <h4 className="text-base font-semibold text-[#2a2d3c] m-0">
                    История бронирований пуста
                  </h4>
                  <p className="text-xs text-[#858a9c] m-0">
                    Все завершённые и отменённые бронирования будут сохраняться
                    здесь.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="footer">
          <span>Есть место — учиться, работать, создавать.</span>
          <span>
            <span className="footer-dot" />
            Кампус открыт с 08:00 до 22:00
          </span>
        </footer>
      </main>
    </div>
  );
}
