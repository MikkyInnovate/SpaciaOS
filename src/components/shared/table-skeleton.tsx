import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export interface TableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  showToolbar?: boolean;
  showPagination?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showToolbar = true,
  showPagination = true,
  className,
  ...props
}: TableSkeletonProps) {
  return (
    <div className={cn("w-full space-y-3", className)} {...props}>
      {/* Toolbar Skeleton */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-stone-200 bg-white shadow-2xs">
          <Skeleton className="h-8 w-64 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </div>
      )}

      {/* Table Container Skeleton */}
      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden shadow-2xs">
        {/* Table Header Row */}
        <div className="flex items-center gap-4 bg-stone-50/70 px-4 py-3 border-b border-stone-200">
          {Array.from({ length: columns }).map((_, idx) => (
            <Skeleton
              key={`th-${idx}`}
              className={cn(
                "h-3.5 rounded",
                idx === 0 ? "w-36" : idx === columns - 1 ? "w-20 ml-auto" : "w-24"
              )}
            />
          ))}
        </div>

        {/* Table Data Rows */}
        <div className="divide-y divide-stone-100">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <div
              key={`tr-${rowIdx}`}
              className="flex items-center gap-4 px-4 py-3.5"
            >
              {Array.from({ length: columns }).map((_, colIdx) => (
                <div
                  key={`td-${rowIdx}-${colIdx}`}
                  className={cn(
                    colIdx === 0
                      ? "w-36 space-y-1.5"
                      : colIdx === columns - 1
                      ? "w-20 ml-auto flex justify-end"
                      : "w-24"
                  )}
                >
                  <Skeleton
                    className={cn(
                      "h-3.5 rounded",
                      colIdx === 0 ? "w-full" : colIdx === columns - 1 ? "w-14" : "w-20"
                    )}
                  />
                  {colIdx === 0 && <Skeleton className="h-2.5 w-24 rounded" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      {showPagination && (
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-40 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-7 w-8 rounded" />
            <Skeleton className="h-7 w-8 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
