import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BantDimension {
  name: string;
  score: number; // 0 - 100
  weight?: string;
  statusText?: string;
}

export interface ScoreIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number; // 0 - 100
  category?: "HOT" | "WARM" | "COLD";
  variant?: "badge" | "gauge" | "breakdown";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  dimensions?: BantDimension[];
}

export function resolveScoreCategory(score: number): "HOT" | "WARM" | "COLD" {
  if (score >= 80) return "HOT";
  if (score >= 60) return "WARM";
  return "COLD";
}

const CATEGORY_STYLES = {
  HOT: {
    badge: "border-rose-200/80 bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-200",
  },
  WARM: {
    badge: "border-amber-200/80 bg-amber-50 text-amber-800",
    bar: "bg-amber-500",
    text: "text-amber-800",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  COLD: {
    badge: "border-stone-200/80 bg-stone-100 text-stone-600",
    bar: "bg-stone-400",
    text: "text-stone-600",
    dot: "bg-stone-400",
    border: "border-stone-200",
  },
};

export function ScoreIndicator({
  score,
  category: propCategory,
  variant = "badge",
  showLabel = true,
  size = "md",
  dimensions,
  className,
  ...props
}: ScoreIndicatorProps) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const category = propCategory || resolveScoreCategory(normalizedScore);
  const styles = CATEGORY_STYLES[category];

  // 1. Compact Badge Variant (Ideal for table cells)
  if (variant === "badge") {
    const sizeClasses = {
      sm: "text-[11px] px-1.5 py-0.5 gap-1",
      md: "text-xs px-2 py-0.5 gap-1.5",
      lg: "text-sm px-2.5 py-1 gap-2",
    };

    return (
      <div
        className={cn(
          "inline-flex items-center rounded-md border font-mono font-semibold tabular-nums shadow-2xs select-none",
          styles.badge,
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <span
          className={cn("rounded-full shrink-0", styles.dot, size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5")}
          aria-hidden="true"
        />
        <span>{normalizedScore}</span>
        {showLabel && (
          <span className="text-[10px] font-sans font-medium uppercase opacity-80">
            {category}
          </span>
        )}
      </div>
    );
  }

  // 2. Horizontal Gauge Variant (Ideal for summary panels & metric cards)
  if (variant === "gauge") {
    return (
      <div className={cn("space-y-1.5 w-full", className)} {...props}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-stone-900 font-mono tabular-nums">
              {normalizedScore}/100
            </span>
            <span
              className={cn(
                "rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wider border shadow-2xs",
                styles.badge
              )}
            >
              {category}
            </span>
          </div>
          {showLabel && (
            <span className="text-[11px] text-stone-500 font-medium">
              Autonomous BANT Score
            </span>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100 border border-stone-200/50">
          <div
            className={cn("h-full transition-all duration-500 rounded-full", styles.bar)}
            style={{ width: `${normalizedScore}%` }}
          />
        </div>
      </div>
    );
  }

  // 3. Multi-Factor Breakdown Variant (BANT breakdown)
  const defaultDimensions: BantDimension[] = dimensions || [
    { name: "Budget Verification", score: normalizedScore >= 80 ? 95 : 65, weight: "30%", statusText: "Verified Proof of Funds" },
    { name: "Authority / Decision Maker", score: normalizedScore >= 80 ? 90 : 70, weight: "25%", statusText: "Sole Buyer" },
    { name: "Need & Property Match", score: normalizedScore >= 80 ? 85 : 60, weight: "25%", statusText: "Strict Requirement Fit" },
    { name: "Timeline to Purchase", score: normalizedScore >= 80 ? 90 : 50, weight: "20%", statusText: "< 30 days" },
  ];

  return (
    <div
      className={cn(
        "rounded-lg border border-stone-200 bg-white p-3.5 space-y-3 shadow-2xs",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div>
          <span className="text-xs font-semibold text-stone-900">
            Qualification Matrix
          </span>
          <p className="text-[11px] text-stone-500">
            5-point underwriting breakdown
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-base font-bold text-stone-900 tabular-nums">
            {normalizedScore}
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border shadow-2xs",
              styles.badge
            )}
          >
            {category}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {defaultDimensions.map((dim) => {
          const dimCategory = resolveScoreCategory(dim.score);
          const dimStyle = CATEGORY_STYLES[dimCategory];

          return (
            <div key={dim.name} className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-stone-700">{dim.name}</span>
                  {dim.weight && (
                    <span className="text-[10px] text-stone-400">({dim.weight})</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {dim.statusText && (
                    <span className="text-stone-500 text-[10px]">{dim.statusText}</span>
                  )}
                  <span className="font-mono font-semibold text-stone-900 tabular-nums">
                    {dim.score}%
                  </span>
                </div>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className={cn("h-full transition-all duration-300 rounded-full", dimStyle.bar)}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
