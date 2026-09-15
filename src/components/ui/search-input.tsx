"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  onClear?: () => void;
  size?: "sm" | "default";
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, size = "default", placeholder = "Search...", ...props }, ref) => {
    const hasValue = Boolean(value && String(value).length > 0);

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (onChange) {
        // Synthesize empty change event
        const event = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    const sizeClasses = {
      sm: "h-8 text-xs pl-8 pr-8",
      default: "h-9 text-xs pl-8.5 pr-8.5",
    };

    const iconSizes = {
      sm: "h-3.5 w-3.5 left-2.5 top-2.5",
      default: "h-4 w-4 left-2.5 top-2.5",
    };

    return (
      <div className="relative w-full">
        <Search
          className={cn("absolute text-stone-400 pointer-events-none", iconSizes[size])}
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-md border border-stone-200 bg-stone-50/70 text-stone-900 placeholder:text-stone-400 transition-colors focus:bg-white focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-50",
            sizeClasses[size],
            className
          )}
          {...props}
        />
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer p-0.5"
            aria-label="Clear search input"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
