"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange?: (dateStr: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Weekdays that cannot be selected. 0 is Sunday. */
  disabledWeekdays?: number[];
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "Select date",
  className,
  disabled = false,
  disabledWeekdays,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!value) return null;
    try {
      const parts = value.split("-");
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      return new Date(value);
    } catch {
      return null;
    }
  }, [value]);

  const formattedLabel = React.useMemo(() => {
    if (!selectedDate || isNaN(selectedDate.getTime())) return placeholder;
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate, placeholder]);

  const handleSelect = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    onChange?.(dateStr);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-start text-left font-normal text-xs bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300 shadow-2xs gap-2 px-3 cursor-pointer",
            !value && "text-stone-400",
            className
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 text-[#0d4a36] shrink-0" />
          <span className="truncate text-stone-800 font-medium">{formattedLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border border-stone-200 shadow-lg bg-white rounded-xl" align="start">
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={handleSelect}
          minDate={minDate}
          maxDate={maxDate}
          disabledWeekdays={disabledWeekdays}
        />
      </PopoverContent>
    </Popover>
  );
}
