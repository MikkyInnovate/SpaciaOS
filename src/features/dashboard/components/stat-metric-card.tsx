import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
}

const VARIANT_STYLES: Record<
  StatMetricVariant,
  {
    iconWrapper: string;
    trend: string;
    badge: string;
  }
> = {
  sky: {
    iconWrapper: "bg-sky-50 border-sky-200/80 text-sky-700",
    trend: "text-sky-800 bg-sky-50/80 border-sky-200/70",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
  },
  amber: {
    iconWrapper: "bg-amber-50 border-amber-200/80 text-amber-700",
    trend: "text-amber-800 bg-amber-50/80 border-amber-200/70",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  emerald: {
    iconWrapper: "bg-emerald-50 border-emerald-200/80 text-[#0d4a36]",
    trend: "text-emerald-800 bg-emerald-50/80 border-emerald-200/70",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rose: {
    iconWrapper: "bg-rose-50 border-rose-200/80 text-rose-700",
    trend: "text-rose-800 bg-rose-50/80 border-rose-200/70",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  indigo: {
    iconWrapper: "bg-indigo-50 border-indigo-200/80 text-indigo-700",
    trend: "text-indigo-800 bg-indigo-50/80 border-indigo-200/70",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  stone: {
    iconWrapper: "bg-stone-50 border-stone-200/80 text-stone-600",
    trend: "text-stone-700 bg-stone-50 border-stone-200/60",
    badge: "bg-stone-100 text-stone-700 border-stone-200",
  },
};

export function StatMetricCard({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  badge,
  variant = "stone",
}: StatMetricCardProps) {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.stone;

  return (
    <Card className="bg-white border-stone-200/80 shadow-2xs hover:border-stone-300 transition-colors">
      <CardContent className="p-4.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
            {title}
          </span>
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border shadow-2xs shrink-0",
              styles.iconWrapper
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums border",
                trend.isPositive !== false ? styles.trend : "text-rose-700 bg-rose-50 border-rose-200"
              )}
            >
              <TrendingUp className="h-3 w-3" />
              {trend.value}
            </span>
          )}
          {badge && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold border",
                styles.badge
              )}
            >
              {badge}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-stone-500 font-normal truncate">{subtext}</p>
      </CardContent>
    </Card>
  );
}
