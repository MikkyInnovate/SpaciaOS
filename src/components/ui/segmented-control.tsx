"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const segmentedControlTrackVariants = cva(
  "relative select-none transition-all",
  {
    variants: {
      variant: {
        capsule:
          "bg-stone-100/90 border border-stone-200/80 shadow-2xs rounded-xl p-1 gap-1",
        underline:
          "bg-transparent border-b border-stone-200 p-0 rounded-none gap-2",
      },
      size: {
        sm: "text-[11px]",
        default: "text-xs",
        lg: "text-sm",
      },
      fullWidth: {
        true: "w-full grid",
        false: "inline-flex items-center",
      },
    },
    defaultVariants: {
      variant: "capsule",
      size: "default",
      fullWidth: false,
    },
  }
);

const segmentedControlItemVariants = cva(
  "relative z-10 inline-flex items-center justify-center font-medium cursor-pointer whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#0d4a36]/30 select-none min-w-0",
  {
    variants: {
      variant: {
        capsule: "gap-1.5",
        underline: "gap-2 pb-2.5 pt-1",
      },
      size: {
        sm: "px-2 py-1 rounded-md text-[11px]",
        default: "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs",
        lg: "px-3.5 sm:px-4 py-2 rounded-lg text-sm",
      },
      disabled: {
        true: "opacity-40 cursor-not-allowed pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "capsule",
      size: "default",
      disabled: false,
    },
  }
);

interface SegmentedControlContextValue {
  value: string;
  onValueChange: (val: string) => void;
  size: "sm" | "default" | "lg";
  variant: "capsule" | "underline";
  isReady: boolean;
  fullWidth: boolean;
}

const SegmentedControlContext = React.createContext<SegmentedControlContextValue | null>(null);

export interface SegmentedControlProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof segmentedControlTrackVariants> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: "capsule" | "underline";
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export function SegmentedControl({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  variant = "capsule",
  size = "default",
  fullWidth = false,
  className,
  children,
  ...props
}: SegmentedControlProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const trackRef = React.useRef<HTMLDivElement>(null);
  const hasAnimated = React.useRef(false);

  const [indicator, setIndicator] = React.useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    ready: boolean;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const handleValueChange = React.useCallback(
    (newVal: string) => {
      if (!isControlled) {
        setInternalValue(newVal);
      }
      onValueChange?.(newVal);
    },
    [isControlled, onValueChange]
  );

  const updateIndicator = React.useCallback(() => {
    if (!trackRef.current) return;
    const activeButton = trackRef.current.querySelector<HTMLButtonElement>(
      `[data-segmented-item="${activeValue}"]`
    );
    if (!activeButton) {
      return;
    }

    const trackRect = trackRef.current.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicator({
      left: buttonRect.left - trackRect.left + trackRef.current.scrollLeft,
      top: buttonRect.top - trackRect.top + trackRef.current.scrollTop,
      width: buttonRect.width,
      height: buttonRect.height,
      ready: true,
    });
  }, [activeValue]);

  useIsomorphicLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  React.useEffect(() => {
    updateIndicator();
    if (!indicator.ready) return;

    // After first initial placement, enable smooth animation
    const timer = setTimeout(() => {
      hasAnimated.current = true;
    }, 50);

    if (typeof ResizeObserver !== "undefined" && trackRef.current) {
      const ro = new ResizeObserver(() => updateIndicator());
      ro.observe(trackRef.current);
      return () => {
        clearTimeout(timer);
        ro.disconnect();
      };
    }

    return () => clearTimeout(timer);
  }, [updateIndicator, indicator.ready]);

  return (
    <SegmentedControlContext.Provider
      value={{
        value: activeValue,
        onValueChange: handleValueChange,
        size: size || "default",
        variant: variant || "capsule",
        isReady: indicator.ready,
        fullWidth: Boolean(fullWidth),
      }}
    >
      <div
        ref={trackRef}
        role="tablist"
        className={cn(segmentedControlTrackVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {/* Sleek, physical sliding indicator */}
        {indicator.ready && variant === "capsule" && (
          <div
            aria-hidden="true"
            className={cn(
              "absolute z-0 bg-white shadow-xs border border-stone-200/80 pointer-events-none will-change-transform",
              size === "sm" ? "rounded-md" : "rounded-lg"
            )}
            style={{
              transform: `translate3d(${indicator.left}px, ${indicator.top}px, 0)`,
              width: `${indicator.width}px`,
              height: `${indicator.height}px`,
              transition: hasAnimated.current
                ? "transform 350ms cubic-bezier(0.16, 1, 0.3, 1), width 350ms cubic-bezier(0.16, 1, 0.3, 1), height 350ms cubic-bezier(0.16, 1, 0.3, 1)"
                : "none",
            }}
          />
        )}

        {indicator.ready && variant === "underline" && (
          <div
            aria-hidden="true"
            className="absolute z-10 bottom-0 h-0.5 bg-[#0d4a36] rounded-full pointer-events-none will-change-transform"
            style={{
              transform: `translate3d(${indicator.left}px, 0, 0)`,
              width: `${indicator.width}px`,
              transition: hasAnimated.current
                ? "transform 320ms cubic-bezier(0.16, 1, 0.3, 1), width 320ms cubic-bezier(0.16, 1, 0.3, 1)"
                : "none",
            }}
          />
        )}

        {children}
      </div>
    </SegmentedControlContext.Provider>
  );
}

export interface SegmentedControlItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  value: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  badgeVariant?: "default" | "emerald" | "amber" | "neutral";
}

export const SegmentedControlItem = React.forwardRef<
  HTMLButtonElement,
  SegmentedControlItemProps
>(
  (
    {
      value,
      icon,
      badge,
      badgeVariant = "neutral",
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const ctx = React.useContext(SegmentedControlContext);
    if (!ctx) {
      throw new Error("SegmentedControlItem must be used within SegmentedControl");
    }

    const isActive = ctx.value === value;
    const isReady = ctx.isReady;
    const isCapsule = ctx.variant === "capsule";

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        data-segmented-item={value}
        disabled={disabled}
        onClick={() => ctx.onValueChange(value)}
        className={cn(
          segmentedControlItemVariants({
            variant: ctx.variant,
            size: ctx.size,
            disabled: !!disabled,
          }),
          ctx.fullWidth && "w-full min-w-0 justify-center",
          "transition-colors duration-200",
          isActive
            ? "text-stone-900 font-semibold"
            : isCapsule
            ? "text-stone-600 hover:text-stone-900 hover:bg-stone-200/40"
            : "text-stone-500 hover:text-stone-800",
          // Fallback static background for capsule before initial animation measurement is ready
          isCapsule && isActive && !isReady && "bg-white shadow-xs border border-stone-200/80",
          className
        )}
        {...props}
      >
        {icon && (
          <span
            className={cn(
              "shrink-0 transition-colors duration-200",
              isActive ? "text-stone-900" : "text-stone-500"
            )}
          >
            {icon}
          </span>
        )}

        <span className="truncate">{children}</span>

        {badge !== undefined && (
          <span
            className={cn(
              "font-mono text-[10px] px-1.5 py-0.2 rounded-md font-bold transition-all duration-200 tabular-nums shrink-0",
              badgeVariant === "emerald"
                ? isActive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-stone-200/70 text-stone-600"
                : badgeVariant === "amber"
                ? isActive
                  ? "bg-amber-100 text-amber-800"
                  : "bg-stone-200/70 text-stone-600"
                : isActive
                ? "bg-stone-100 text-stone-800"
                : "bg-stone-200/70 text-stone-600"
            )}
          >
            {badge}
          </span>
        )}
      </button>
    );
  }
);
SegmentedControlItem.displayName = "SegmentedControlItem";
