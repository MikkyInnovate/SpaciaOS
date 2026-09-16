import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tabular-nums select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-stone-900 text-white",
        secondary: "border-transparent bg-stone-100 text-stone-700 hover:bg-stone-200/70",
        destructive: "border-red-200/80 bg-red-50 text-red-700",
        outline: "border-stone-200/80 text-stone-700 bg-white",
        success: "border-emerald-200/80 bg-emerald-50/60 text-emerald-800 font-medium",
        warning: "border-amber-200/80 bg-amber-50/60 text-amber-800 font-medium",
        info: "border-stone-200 bg-stone-50 text-stone-700",
        hot: "border-rose-200/70 bg-rose-50/70 text-rose-700 font-semibold",
        warm: "border-amber-200/70 bg-amber-50/70 text-amber-800 font-medium",
        cold: "border-stone-200/70 bg-stone-100/80 text-stone-600",
        live: "border-emerald-200/80 bg-emerald-50/70 text-emerald-800 font-semibold",
        qualified: "border-emerald-200/90 bg-emerald-50/80 text-emerald-800 font-medium",
        viewing: "border-indigo-200/80 bg-indigo-50/80 text-indigo-800 font-medium",
        inConversation: "border-blue-200/80 bg-blue-50/80 text-blue-800 font-medium",
        contacting: "border-amber-200/80 bg-amber-50/80 text-amber-800 font-medium",
        nurture: "border-stone-200 bg-stone-100 text-stone-600 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
