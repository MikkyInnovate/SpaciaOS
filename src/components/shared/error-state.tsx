import * as React from "react";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  errorCode?: string | number;
  errorDetails?: string | Error | null;
  onRetry?: () => void;
  resetText?: string;
  secondaryAction?: React.ReactNode;
  size?: "default" | "compact";
}

export function ErrorState({
  title = "Unable to load data",
  description = "An unexpected error occurred while fetching domain records.",
  errorCode,
  errorDetails,
  onRetry,
  resetText = "Retry Request",
  secondaryAction,
  size = "default",
  className,
  ...props
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const formattedDetails = errorDetails
    ? typeof errorDetails === "string"
      ? errorDetails
      : errorDetails.message || JSON.stringify(errorDetails, null, 2)
    : null;

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-red-200/80 bg-red-50/40 p-6 text-center animate-in fade-in-50 duration-200",
        size === "compact" ? "min-h-[200px]" : "min-h-[300px]",
        className
      )}
      {...props}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100/70 text-red-600 border border-red-200 mb-3">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="flex items-center gap-1.5 justify-center">
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        {errorCode && (
          <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-mono font-semibold text-red-700">
            {errorCode}
          </span>
        )}
      </div>

      <p className="mt-1 max-w-md text-xs text-stone-600 leading-relaxed">
        {description}
      </p>

      {formattedDetails && (
        <div className="mt-3 w-full max-w-md text-left">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-medium text-stone-500 hover:text-stone-700 cursor-pointer mx-auto"
          >
            <span>{showDetails ? "Hide technical details" : "Show technical details"}</span>
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showDetails && (
            <pre className="mt-2 p-2.5 rounded bg-stone-900 text-stone-100 text-[11px] font-mono overflow-x-auto max-h-36 whitespace-pre-wrap">
              {formattedDetails}
            </pre>
          )}
        </div>
      )}

      {(onRetry || secondaryAction) && (
        <div className="mt-4 flex items-center gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8 gap-1.5 text-xs text-stone-700 bg-white hover:bg-stone-50 border-stone-300 shadow-2xs cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{resetText}</span>
            </Button>
          )}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
