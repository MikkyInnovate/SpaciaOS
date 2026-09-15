"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string | number;
  onValueChange?: (value: string, rawNumber: number) => void;
  currencySymbol?: string;
  sizeVariant?: "sm" | "default";
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value = "",
      onValueChange,
      currencySymbol = "₦",
      sizeVariant = "default",
      placeholder = "0.00",
      ...props
    },
    ref
  ) => {
    const formatNumber = (val: string | number): string => {
      if (val === "" || val === null || val === undefined) return "";
      const cleaned = String(val).replace(/[^0-9.]/g, "");
      const parts = cleaned.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.slice(0, 2).join(".");
    };

    const [displayValue, setDisplayValue] = React.useState<string>(formatNumber(value));

    React.useEffect(() => {
      setDisplayValue(formatNumber(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      const raw = inputVal.replace(/[^0-9.]/g, "");
      const formatted = formatNumber(raw);
      setDisplayValue(formatted);

      if (onValueChange) {
        const numeric = parseFloat(raw) || 0;
        onValueChange(formatted, numeric);
      }
    };

    const sizeClasses = {
      sm: "h-8 text-xs pl-7 pr-3",
      default: "h-9 text-xs pl-7.5 pr-3",
    };

    return (
      <div className="relative w-full">
        <span
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 font-mono font-semibold text-xs select-none pointer-events-none"
          aria-hidden="true"
        >
          {currencySymbol}
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-md border border-stone-200 bg-white font-mono tabular-nums text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-50",
            sizeClasses[sizeVariant],
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
