import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface WeekRangePickerProps {
  from: string;
  to: string;
  max: string;
  onChange: (range: { from: string; to: string }) => void;
}

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export function WeekRangePicker({ from, to, max, onChange }: WeekRangePickerProps) {
  const [displayMonth, setDisplayMonth] = useState(() => monthStart(parseDate(from)));
  const [selectingEnd, setSelectingEnd] = useState(false);
  const maxTime = parseDate(max);
  const selectedStart = weekStart(parseDate(from));
  const selectedEnd = weekStart(parseDate(to));
  const calendarDays = getCalendarDays(displayMonth);

  const handleSelectWeek = (date: Date) => {
    const nextWeekStart = weekStart(date.getTime());

    if (!selectingEnd) {
      onChange({
        from: formatDate(nextWeekStart),
        to: formatDate(Math.min(nextWeekStart + 6 * DAY, maxTime)),
      });
      setSelectingEnd(true);
      return;
    }

    const rangeStart = Math.min(selectedStart, nextWeekStart);
    const rangeEnd = Math.max(selectedStart, nextWeekStart);
    onChange({
      from: formatDate(rangeStart),
      to: formatDate(Math.min(rangeEnd + 6 * DAY, maxTime)),
    });
    setSelectingEnd(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start font-normal lg:w-[280px]"
          aria-label="주 범위 선택"
        >
          <CalendarDays className="text-muted-foreground" />
          {formatRange(from, to)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[328px] p-3" align="start">
        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="이전 달"
            onClick={() => setDisplayMonth((month) => addMonths(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <p className="text-sm font-semibold">{formatMonth(displayMonth)}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="다음 달"
            disabled={monthStart(maxTime) <= displayMonth}
            onClick={() => setDisplayMonth((month) => addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
          {WEEKDAY_LABELS.map((weekday) => (
            <span key={weekday} className="py-2">
              {weekday}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((date) => {
            const time = date.getTime();
            const currentWeek = weekStart(time);
            const isSelectedStart = currentWeek === selectedStart;
            const isSelectedEnd = currentWeek === selectedEnd;
            const isInRange = currentWeek >= selectedStart && currentWeek <= selectedEnd;
            const isCurrentMonth = date.getUTCMonth() === displayMonth.getUTCMonth();
            const isDisabled = time > maxTime;

            return (
              <button
                key={time}
                type="button"
                aria-label={`${formatDate(time)} 주 선택`}
                disabled={isDisabled}
                onClick={() => handleSelectWeek(date)}
                className={cn(
                  'h-9 text-sm transition-colors disabled:pointer-events-none disabled:opacity-30',
                  !isCurrentMonth && 'text-muted-foreground/50',
                  isInRange && 'bg-accent',
                  (isSelectedStart || isSelectedEnd) && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {date.getUTCDate()}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {selectingEnd ? '종료 주를 선택하세요.' : '시작 주와 종료 주를 차례로 선택하세요.'}
        </p>
      </PopoverContent>
    </Popover>
  );
}

const DAY = 86_400_000;

function parseDate(value: string): number {
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  return Date.UTC(year, month - 1, day);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function weekStart(timestamp: number): number {
  const date = new Date(timestamp);
  const day = date.getUTCDay() || 7;
  return timestamp - (day - 1) * DAY;
}

function monthStart(timestamp: number): Date {
  const date = new Date(timestamp);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addMonths(month: Date, amount: number): Date {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + amount, 1));
}

function getCalendarDays(month: Date): Date[] {
  const firstDay = weekStart(month.getTime());
  return Array.from({ length: 42 }, (_, index) => new Date(firstDay + index * DAY));
}

function formatMonth(month: Date): string {
  return `${month.getUTCFullYear()}년 ${month.getUTCMonth() + 1}월`;
}

function formatRange(from: string, to: string): string {
  return `${from.replace(/-/g, '. ')}. ~ ${to.replace(/-/g, '. ')}.`;
}
