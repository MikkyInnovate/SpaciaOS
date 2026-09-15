"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "default";
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      checked,
      defaultChecked,
      onChange,
      onCheckedChange,
      disabled,
      size = "default",
      ...props
    },
    ref
  ) => {
    const [isChecked, setIsChecked] = React.useState<boolean>(
      Boolean(checked ?? defaultChecked ?? false)
    );

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(Boolean(checked));
      }
    }, [checked]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextChecked = e.target.checked;
      if (checked === undefined) {
        setIsChecked(nextChecked);
      }
      onChange?.(e);
      onCheckedChange?.(nextChecked);
    };

    const isCurrentChecked = checked !== undefined ? checked : isChecked;

    const dimensions = {
      sm: {
        track: "h-4 w-7",
        thumb: "h-3 w-3 translate-x-0.5 peer-checked:translate-x-3.5",
      },
      default: {
        track: "h-5 w-9",
        thumb: "h-4 w-4 translate-x-0.5 peer-checked:translate-x-4.5",
      },
    }[size];

    return (
      <label
        className={cn(
          "relative inline-flex items-center select-none cursor-pointer",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={isCurrentChecked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "rounded-full transition-colors duration-200 border border-transparent shadow-2xs flex items-center",
            dimensions.track,
            isCurrentChecked ? "bg-[#0d4a36]" : "bg-stone-300",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-stone-400 peer-focus-visible:ring-offset-1",
            className
          )}
        >
          <div
            className={cn(
              "rounded-full bg-white shadow-xs transition-transform duration-200",
              dimensions.thumb
            )}
          />
        </div>
      </label>
    );
  }
);
Switch.displayName = "Switch";
