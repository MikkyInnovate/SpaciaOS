import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, type LucideIcon } from "lucide-react";

export type StatMetricVariant = "sky" | "amber" | "emerald" | "rose" | "indigo" | "stone";

export interface StatMetricCardProps {
  title: string;
  value: string | number;
  subtext: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon: LucideIcon;
  badge?: string;
  variant?: StatMetricVariant;
  highlight?: boolean;
  isLoading?: boolean;
}

// Restrained brand palette: neutral tiles, green for positive/qualified, rose only for urgency
const CALM = {
  iconWrapper: "bg-[#f7f7f5] border-zinc-200 text-zinc-500",
  trend: "text-[#15803d] bg-[#15803d]/[0.07] border-[#15803d]/15",
  badge: "bg-white text-zinc-600 border-zinc-200",
};
const VARIANT_STYLES: Record<StatMetricVariant, { iconWrapper: string; trend: string; badge: string }> = {
  sky: CALM,
  amber: CALM,
  indigo: CALM,
  stone: CALM,
  emerald: { ...CALM, iconWrapper: "bg-[#15803d]/[0.07] border-[#15803d]/15 text-[#15803d]" },
  rose: { ...CALM, iconWrapper: "bg-rose-50 border-rose-100 text-rose-600", badge: "bg-rose-50 text-rose-700 border-rose-100" },
};

export function StatMetricCard({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  badge,
  variant = "stone",
  isLoading = false,
}: StatMetricCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[8px] border-zinc-200 bg-white shadow-none">
        <CardContent className="p-4.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.stone;

  return (
    <Card className="rounded-[8px] border-zinc-200 bg-white shadow-none transition-colors hover:border-[#15803d]/30">
      <CardContent className="p-4.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            {title}
          </span>
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border",
              styles.iconWrapper
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="font-display text-[32px] font-light leading-none tracking-[-0.035em] text-[#14231d] tabular-nums">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium leading-none tabular-nums",
                trend.isPositive !== false ? styles.trend : "text-rose-700 bg-rose-50 border-rose-200"
              )}
            >
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span>{trend.value}</span>
            </span>
          )}
          {badge && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] leading-none",
                styles.badge
              )}
            >
              {badge}
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-zinc-500">{subtext}</p>
      </CardContent>
    </Card>
  );
}
