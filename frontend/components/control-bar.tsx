import { useMemo } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { formatTime, TIME_OPTIONS, getToday, getUpcomingDays } from '@/lib/campus';
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
    <section className="control-bar" aria-label="Параметры поиска">
      {/* Date selector: strictly upcoming week */}
      <div className="date-control flex items-center">
        <CalendarDays size={19} className="text-[#8e879f] shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="control-caption text-[11px] font-medium text-muted-foreground select-none">
            {t.when}
          </span>
          <Select
            value={date || null}
            onValueChange={(val) => {
              if (val) onDateChange(val);
            }}
          >
            <SelectTrigger
              id="control-date-select"
              className="h-auto p-0 border-0 shadow-none font-semibold text-sm text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent! dark:hover:bg-transparent! hover:text-primary dark:hover:text-primary focus:ring-0 focus:outline-none min-w-[155px] cursor-pointer select-none"
              aria-label={t.when}
            >
              <SelectValue placeholder={t.selectDatePrompt}>
                {selectedDayLabel || t.selectDatePrompt}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {upcomingDays.map((dayStr, idx) => (
                <SelectItem key={dayStr} value={dayStr} className="select-none">
                  {formatDayLabel(dayStr, idx)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time selector: 08:00 - 22:00 */}
      <div className="time-control flex items-center">
        <Clock3 size={19} className="text-[#8e879f] shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="control-caption text-[11px] font-medium text-muted-foreground select-none">
            {t.time}
          </span>
          <Select
            value={time !== null ? String(time) : null}
            onValueChange={(value) => {
              if (value !== null) onTimeChange(Number(value));
            }}
          >
            <SelectTrigger
              id="control-time-select"
              className="h-auto p-0 border-0 shadow-none font-semibold text-sm text-foreground bg-transparent! dark:bg-transparent! hover:bg-transparent! dark:hover:bg-transparent! hover:text-primary dark:hover:text-primary focus:ring-0 focus:outline-none min-w-[120px] cursor-pointer select-none"
              aria-label={t.time}
            >
              <SelectValue placeholder={t.selectTimePrompt}>
                {time !== null ? formatTime(time) : t.selectTimePrompt}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((value) => (
                <SelectItem key={value} value={String(value)} className="select-none">
                  {formatTime(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
