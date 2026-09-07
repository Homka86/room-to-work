import { useMemo } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { formatTime, TIME_OPTIONS, DEMO_DATE, getUpcomingDays } from '@/lib/campus';
import type { Translation, Language } from '@/lib/translations';

interface ControlBarProps {
  date: string;
  time: number | null;
  t: Translation;
  lang: Language;
  onDateChange: (newDate: string) => void;
  onTimeChange: (newTime: number) => void;
  onlyFree?: boolean;
  onOnlyFreeChange?: (value: boolean) => void;
}

export function ControlBar({
  date,
  time,
  t,
  lang,
  onDateChange,
  onTimeChange,
  onlyFree = false,
  onOnlyFreeChange,
}: ControlBarProps) {
  const upcomingDays = useMemo(() => getUpcomingDays(7, DEMO_DATE), []);

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
    const weekDaysRu = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    const weekDaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const m = lang === 'ru' ? monthsRu[d.getMonth()] : monthsEn[d.getMonth()];
    const wd = lang === 'ru' ? weekDaysRu[d.getDay()] : weekDaysEn[d.getDay()];

    if (index === 0) {
      return `${t.today}, ${dayNum} ${m}`;
    }
    if (index === 1) {
      return `${t.tomorrow}, ${dayNum} ${m}`;
    }
    return `${wd.toUpperCase()}, ${dayNum} ${m}`;
  };

  const selectedDayIndex = upcomingDays.indexOf(date);
  const selectedDayLabel =
    selectedDayIndex >= 0 ? formatDayLabel(date, selectedDayIndex) : '';

  return (
    <section className="control-bar" aria-label="Параметры поиска">
      {/* Date selector: strictly upcoming week */}
      <div className="date-control flex items-center gap-3 pr-5 border-r border-border">
        <CalendarDays size={19} className="text-[#8e879f] shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="control-caption text-[11px] font-medium text-muted-foreground">
            {t.when}
          </span>
          <Select
            value={date || undefined}
            onValueChange={(val) => {
              if (val) onDateChange(val);
            }}
          >
            <SelectTrigger
              id="control-date-select"
              className="h-auto p-0 border-0 shadow-none font-semibold text-sm text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent! dark:hover:bg-transparent! hover:text-primary dark:hover:text-primary focus:ring-0 focus:outline-none min-w-[155px] cursor-pointer"
              aria-label={t.when}
            >
              <SelectValue placeholder={t.selectDatePrompt}>
                {selectedDayLabel || t.selectDatePrompt}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {upcomingDays.map((dayStr, idx) => (
                <SelectItem key={dayStr} value={dayStr}>
                  {formatDayLabel(dayStr, idx)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time selector: 08:00 - 22:00 */}
      <div className="time-control flex items-center gap-3 pl-2 sm:pl-3">
        <Clock3 size={19} className="text-[#8e879f] shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="control-caption text-[11px] font-medium text-muted-foreground">
            {t.time}
          </span>
          <Select
            value={time !== null ? String(time) : undefined}
            onValueChange={(value) => {
              if (value !== null) onTimeChange(Number(value));
            }}
          >
            <SelectTrigger
              id="control-time-select"
              className="h-auto p-0 border-0 shadow-none font-semibold text-sm text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent! dark:hover:bg-transparent! hover:text-primary dark:hover:text-primary focus:ring-0 focus:outline-none min-w-[120px] cursor-pointer"
              aria-label={t.time}
            >
              <SelectValue placeholder={t.selectTimePrompt}>
                {time !== null ? formatTime(time) : t.selectTimePrompt}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {formatTime(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {onOnlyFreeChange && (
        <>
          <span className="control-spacer" />
          <label className="free-filter">
            <span>{t.onlyFree}</span>
            <Switch
              id="only-free-toggle"
              checked={onlyFree}
              onCheckedChange={onOnlyFreeChange}
              aria-label={t.onlyFree}
            />
          </label>
        </>
      )}
    </section>
  );
}
