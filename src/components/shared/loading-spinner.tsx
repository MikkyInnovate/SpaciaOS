import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
  label?: string;
}

export function LoadingSpinner({
  className,
  size = "default",
  label = "Loading...",
  ...props
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-10 w-10",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex flex-col items-center justify-center gap-2", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-muted-foreground", sizeMap[size])} />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <span className="sr-only">{label}</span>
    </div>
  );
}
