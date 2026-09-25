"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface CalendarProps {
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function Calendar({
  selectedDate,
  onSelectDate,
  className,
  minDate,
  maxDate,
}: CalendarProps) {
  const [viewDate, setViewDate] = React.useState<Date>(
    () => selectedDate || new Date()
  );

  React.useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Days in month calculation
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Grid cells
  const cells: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    cells.push({
      day,
      isCurrentMonth: false,
      date: new Date(year, month - 1, day),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      isCurrentMonth: true,
      date: new Date(year, month, d),
    });
  }

  // Next month leading days to complete grid (up to 35 or 42)
  const remaining = 35 - cells.length;
  if (remaining > 0) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        day: d,
        isCurrentMonth: false,
        date: new Date(year, month + 1, d),
      });
    }
  }

  const isSameDay = (d1?: Date | null, d2?: Date | null) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isBeforeMin = (date: Date) => {
    if (!minDate) return false;
    const startOfMin = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const startOfCurrent = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return startOfCurrent < startOfMin;
  };

  const isAfterMax = (date: Date) => {
    if (!maxDate) return false;
    const startOfMax = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    const startOfCurrent = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return startOfCurrent > startOfMax;
  };

  return (
    <div className={cn("p-3 select-none w-[280px] bg-white rounded-xl", className)}>
      {/* Month & Year Header */}
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-stone-100">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-xs font-semibold text-stone-900">
          {MONTH_NAMES[month]} {year}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 gap-1 text-center py-1.5 text-[11px] font-medium text-stone-400">
        {WEEKDAY_NAMES.map((w) => (
          <div key={w} className="w-8 h-6 flex items-center justify-center">
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {cells.map((cell, idx) => {
          const isSelected = isSameDay(selectedDate, cell.date);
          const isToday = isSameDay(new Date(), cell.date);
          const isDisabled = isBeforeMin(cell.date) || isAfterMax(cell.date);

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled && onSelectDate) onSelectDate(cell.date);
              }}
              className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center text-xs transition-all",
                isDisabled
                  ? "text-stone-300 cursor-not-allowed opacity-40"
                  : "cursor-pointer",
                !cell.isCurrentMonth && !isDisabled && "text-stone-300 hover:text-stone-600",
                cell.isCurrentMonth && !isSelected && !isDisabled && "text-stone-700 hover:bg-stone-100",
                isToday && !isSelected && !isDisabled && "border border-emerald-300 font-semibold text-[#0d4a36]",
                isSelected && "bg-[#0d4a36] text-white font-semibold shadow-xs hover:bg-[#0a3829]"
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
