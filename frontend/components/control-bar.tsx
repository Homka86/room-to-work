import { useMemo } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  formatTime,
  TIME_OPTIONS,
  getToday,
  getUpcomingDays,
  type Room,
} from '@/lib/campus';
import type { Translation, Language } from '@/lib/translations';

interface ControlBarProps {
  date: string;
  time: number | null;
  t: Translation;
  lang: Language;
  floor: number;
  rooms: Room[];
  onDateChange: (newDate: string) => void;
  onTimeChange: (newTime: number) => void;
  onFloorChange: (floor: number) => void;
  onlyFree?: boolean;
  onOnlyFreeChange?: (value: boolean) => void;
}

export function ControlBar({
  date,
  time,
  t,
  lang,
  floor,
  rooms,
  onDateChange,
  onTimeChange,
  onFloorChange,
}: ControlBarProps) {
  const upcomingDays = useMemo(() => getUpcomingDays(7, getToday()), []);

  const formatDayLabel = (dayStr: string, index: number): string => {
    const d = new Date(dayStr + 'T12:00:00');
    const dayNum = d.getDate();
    const monthsRu = [
      'янв',
      'фев',
      'мар',
      'апр',
      'мая',
      'июн',
      'июл',
      'авг',
      'сен',
      'окт',
      'ноя',
      'дек',
    ];
    const monthsEn = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const weekDaysRu = [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ];
    const weekDaysEn = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const m = lang === 'ru' ? monthsRu[d.getMonth()] : monthsEn[d.getMonth()];
    const wd = lang === 'ru' ? weekDaysRu[d.getDay()] : weekDaysEn[d.getDay()];

    if (index === 0) {
      return `${t.today}, ${dayNum} ${m}`;
    }
    if (index === 1) {
      return `${t.tomorrow}, ${dayNum} ${m}`;
    }
    return `${wd}, ${dayNum} ${m}`;
  };

  const selectedDayIndex = upcomingDays.indexOf(date);
  const selectedDayLabel =
    selectedDayIndex >= 0 ? formatDayLabel(date, selectedDayIndex) : '';

  return (
    <section
      className="control-bar flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-2.5 rounded-2xl bg-card border border-border"
      aria-label="Параметры поиска"
    >
      {/* Selectors Group: 2 columns on mobile, row on desktop */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto">
        {/* Date selector: strictly upcoming week */}
        <Select
          value={date || null}
          onValueChange={(val) => {
            if (val) onDateChange(val);
          }}
        >
          <SelectTrigger
            id="control-date-select"
            className="group flex min-h-[44px] h-auto w-full items-center gap-2.5 rounded-xl border border-border/60 sm:border-0 bg-muted/30 sm:bg-transparent px-3 py-2 text-left shadow-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer select-none active:bg-muted/70"
            aria-label={t.when}
          >
            <CalendarDays className="size-4.5 sm:size-5 text-[#8e879f] transition-colors group-hover:text-primary shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground select-none leading-none">
                {t.when}
              </span>
              <div className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                <SelectValue placeholder={t.selectDatePrompt}>
                  {selectedDayLabel || t.selectDatePrompt}
                </SelectValue>
              </div>
            </div>
          </SelectTrigger>
          <SelectContent align="start" side="bottom" sideOffset={8} className="min-w-[210px]">
            {upcomingDays.map((dayStr, idx) => (
              <SelectItem key={dayStr} value={dayStr}>
                {formatDayLabel(dayStr, idx)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Vertical Divider for desktop */}
        <div className="hidden sm:block h-8 w-px bg-border my-auto mx-1 shrink-0" aria-hidden="true" />

        {/* Time selector: 08:00 - 22:00 */}
        <Select
          value={time !== null ? String(time) : null}
          onValueChange={(value) => {
            if (value !== null) onTimeChange(Number(value));
          }}
        >
          <SelectTrigger
            id="control-time-select"
            className="group flex min-h-[44px] h-auto w-full items-center gap-2.5 rounded-xl border border-border/60 sm:border-0 bg-muted/30 sm:bg-transparent px-3 py-2 text-left shadow-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/40 cursor-pointer select-none active:bg-muted/70"
            aria-label={t.time}
          >
            <Clock3 className="size-4.5 sm:size-5 text-[#8e879f] transition-colors group-hover:text-primary shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground select-none leading-none">
                {t.time}
              </span>
              <div className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                <SelectValue placeholder={t.selectTimePrompt}>
                  {time !== null ? formatTime(time) : t.selectTimePrompt}
                </SelectValue>
              </div>
            </div>
          </SelectTrigger>
          <SelectContent align="start" side="bottom" sideOffset={8} className="min-w-[170px]">
            {TIME_OPTIONS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {formatTime(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Floor switcher tabs */}
      <div className="floor-tabs-container w-full sm:w-auto sm:ml-auto flex items-center">
        <div className="floor-tabs-list w-full sm:w-auto grid grid-cols-3 sm:flex items-center" role="tablist" aria-label={lang === 'ru' ? 'Этаж' : 'Floor'}>
          {[1, 2, 3].map((floorNumber) => {
            const count = rooms.filter((room) => room.floor === floorNumber).length;
            const isActive = floor === floorNumber;
            return (
              <button
                key={floorNumber}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-state={isActive ? 'active' : 'inactive'}
                onClick={() => onFloorChange(floorNumber)}
                className="floor-tab cursor-pointer touch-manipulation active:scale-[0.98]"
                title={`${floorNumber} ${t.floorWord} (${count})`}
                aria-label={`${floorNumber} ${t.floorWord}, ${count}`}
              >
                <span className="floor-number-badge">{floorNumber}</span>
                <span className="floor-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
