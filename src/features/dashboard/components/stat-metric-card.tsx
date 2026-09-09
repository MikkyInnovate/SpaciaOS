import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, type LucideIcon } from "lucide-react";

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
  highlight?: boolean;
}

export function StatMetricCard({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
  badge,
}: StatMetricCardProps) {
  return (
    <Card className="bg-white border-border shadow-2xs hover:border-stone-300 transition-colors">
      <CardContent className="p-4.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-stone-500 tracking-wider uppercase">
            {title}
          </span>
          <Icon className="h-4 w-4 text-stone-400" aria-hidden="true" />
        </div>

        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-stone-900 tabular-nums">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
                trend.isPositive !== false ? "text-stone-700" : "text-rose-600"
              )}
            >
              <TrendingUp className="h-3 w-3 text-stone-500" />
              {trend.value}
            </span>
          )}
          {badge && (
            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700 border border-stone-200">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-stone-500 font-normal truncate">{subtext}</p>
      </CardContent>
    </Card>
  );
}
