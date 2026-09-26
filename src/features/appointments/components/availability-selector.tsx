"use client";

import * as React from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { appointmentsService } from "../services/appointments-service";
import { ViewingSlot } from "../types";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  CalendarX2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface AvailabilitySelectorProps {
  propertyId: string;
  selectedDate?: string; // YYYY-MM-DD
  onDateChange?: (dateStr: string) => void;
  selectedSlotId?: string;
  onSelectSlot: (slot: ViewingSlot) => void;
  brokerId?: string;
  disabled?: boolean;
  className?: string;
  hideDatePicker?: boolean;
  showSyncBadge?: boolean;
}

export function AvailabilitySelector({
  propertyId,
  selectedDate: controlledDate,
  onDateChange,
  selectedSlotId,
  onSelectSlot,
  brokerId,
  disabled = false,
  className,
  hideDatePicker = false,
  showSyncBadge = true,
}: AvailabilitySelectorProps) {
  // Default to the next open day. Sundays are closed.
  const defaultDate = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
  }, []);

  const [internalDate, setInternalDate] = React.useState<string>(defaultDate);
  const activeDate = controlledDate || internalDate;

  const [slots, setSlots] = React.useState<ViewingSlot[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleDateChange = (newDate: string) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const fetchSlots = React.useCallback(async () => {
    if (!propertyId || !activeDate) return;
    setIsLoading(true);
    setErrorMessage(null);

    const [year, month, day] = activeDate.split("-").map((part) => parseInt(part, 10));
    if (year && month && day && new Date(year, month - 1, day).getDay() === 0) {
      setSlots([]);
      setIsLoading(false);
      return;
    }

    try {
      const dateObj = new Date(year, (month || 1) - 1, day || 1);
      const data = await appointmentsService.getAvailableSlots(propertyId, dateObj);
      setSlots(data || []);

      // If currently selected slot is no longer available in new date, notify parent
      if (selectedSlotId) {
        const stillValid = data.find((s) => s.id === selectedSlotId && s.isAvailable);
        if (!stillValid) {
          const firstOpen = data.find((s) => s.isAvailable);
          if (firstOpen) {
            onSelectSlot(firstOpen);
          }
        }
      } else {
        // Auto-select first available slot if none selected
        const firstOpen = data.find((s) => s.isAvailable);
        if (firstOpen) {
          onSelectSlot(firstOpen);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to load availability slots");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, activeDate, selectedSlotId, onSelectSlot]);

  React.useEffect(() => {
    fetchSlots();
  }, [propertyId, activeDate]);

  const availableCount = slots.filter((s) => s.isAvailable).length;
  const totalCount = slots.length;
  const isSunday = React.useMemo(() => {
    const [year, month, day] = activeDate.split("-").map((part) => parseInt(part, 10));
    if (!year || !month || !day) return false;
    return new Date(year, month - 1, day).getDay() === 0;
  }, [activeDate]);

  return (
    <div
      className={cn(
        "rounded-xl border border-stone-200/90 bg-stone-50/40 p-4 space-y-3.5 text-stone-900",
        className
      )}
    >
      {/* Date Picker Row */}
      {!hideDatePicker && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-stone-200/70">
          <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5 shrink-0">
            <CalendarDays className="h-3.5 w-3.5 text-[#0d4a36]" />
            <span>Inspection Date</span>
          </label>
          <div className="w-full sm:w-56 shrink-0">
            <DatePicker
              value={activeDate}
              minDate={new Date()}
              disabled={disabled}
              disabledWeekdays={[0]}
              onChange={handleDateChange}
            />
          </div>
        </div>
      )}

      {/* Slots Section Header & Live Sync Status */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-stone-600">
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-semibold text-stone-800">Available Inspection Windows</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showSyncBadge && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 whitespace-nowrap shrink-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="whitespace-nowrap">Google Calendar Synced</span>
              </div>
            )}

            {!isLoading && totalCount > 0 && (
              <span className="inline-block text-[11px] font-mono text-stone-500 font-medium whitespace-nowrap shrink-0">
                {availableCount} of {totalCount} open
              </span>
            )}

            <button
              type="button"
              onClick={fetchSlots}
              disabled={isLoading || disabled}
              title="Refresh availability"
              className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-200/50 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin text-[#0d4a36]")} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-stone-200 bg-white space-y-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#0d4a36]" />
            <p className="text-xs text-stone-500 font-medium">
              Checking Google Calendar & broker availability...
            </p>
          </div>
        ) : errorMessage ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-rose-200 bg-rose-50/50 space-y-2 text-center">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <p className="text-xs text-rose-700">{errorMessage}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchSlots}
              className="text-xs h-7 border-rose-200 bg-white hover:bg-rose-50 text-rose-800 cursor-pointer"
            >
              Retry Availability Check
            </Button>
          </div>
        ) : isSunday || slots.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-stone-200 bg-white text-center space-y-1.5">
            <CalendarX2 className="h-5 w-5 text-stone-400" />
            <p className="text-xs font-medium text-stone-700">
              {isSunday ? "Closed on Sundays" : "No inspection slots available"}
            </p>
            <p className="text-[11px] text-stone-400 max-w-xs">
              {isSunday
                ? "Inspections run Monday to Saturday. Choose another date."
                : "All slots are currently booked for this date. Please choose a different date on the calendar."}
            </p>
          </div>
        ) : (
          /* Real Slots Grid */
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {slots.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              const isAvailable = slot.isAvailable;

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!isAvailable || disabled}
                  onClick={() => isAvailable && onSelectSlot(slot)}
                  className={cn(
                    "group relative flex flex-col items-start p-3 rounded-lg border text-left transition-all text-xs cursor-pointer select-none",
                    !isAvailable
                      ? "border-stone-200 bg-stone-100/70 text-stone-400 cursor-not-allowed opacity-75"
                      : isSelected
                      ? "border-[#0d4a36] bg-emerald-50/80 text-[#0d4a36] font-semibold ring-1.5 ring-[#0d4a36] shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/80 text-stone-800 shadow-2xs"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium tracking-tight">
                      {slot.formattedTime.split("–")[0]?.trim() || slot.formattedTime}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="h-4 w-4 text-[#0d4a36] shrink-0" />
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between w-full text-[10px]">
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                        Real Available Slot
                      </span>
                    ) : (
                      <span
                        className="truncate text-stone-400 font-normal"
                        title={slot.reasonUnavailable || "Slot unavailable"}
                      >
                        Booked
                      </span>
                    )}
                  </div>

                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
