import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onRetry?: () => void;
  resetText?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred while loading this view.",
  onRetry,
  resetText = "Try again",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-6"
        >
          {resetText}
        </Button>
      )}
    </div>
  );
}
