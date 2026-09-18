import * as React from "react";
import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export function AIAgentSkeletonLoading() {
  return (
    <Container size="lg" className="space-y-4 pb-16 animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded bg-stone-200" />
          <Skeleton className="h-4 w-80 max-w-full rounded bg-stone-200/70" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-md bg-stone-200/80" />
          <Skeleton className="h-8 w-36 rounded-md bg-stone-200/80" />
          <Skeleton className="h-8 w-24 rounded-md bg-stone-200/80" />
        </div>
      </div>

      {/* 2. Top Metric Row Skeletons (5 cards matching StatMetricCards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-white p-4.5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded bg-stone-200" />
              <Skeleton className="h-4 w-4 rounded-full bg-stone-200" />
            </div>
            <Skeleton className="h-7 w-24 rounded bg-stone-200" />
            <Skeleton className="h-3 w-32 rounded bg-stone-200/60" />
          </div>
        ))}
      </div>

      {/* 3. Middle Split Skeletons (7 cols / 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Active Call Radar Skeleton (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-border p-4 bg-stone-50/50">
              <div className="space-y-1.5">
                <Skeleton className="h-4.5 w-36 rounded bg-stone-200" />
                <Skeleton className="h-3 w-64 rounded bg-stone-200/60" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7.5 w-20 rounded bg-stone-200" />
                <Skeleton className="h-7.5 w-24 rounded bg-stone-200" />
              </div>
            </div>
            <div className="p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <Skeleton className="h-4 w-44 rounded bg-stone-200" />
                <Skeleton className="h-4 w-32 rounded bg-stone-200" />
              </div>
              {/* Simulated Audio Bar */}
              <Skeleton className="h-14 w-full rounded-lg bg-stone-100" />
              {/* Summary Box */}
              <Skeleton className="h-14 w-full rounded-lg bg-stone-100" />
              {/* Speech Turns */}
              <div className="space-y-2.5">
                <Skeleton className="h-16 w-full rounded-lg bg-stone-100" />
                <Skeleton className="h-16 w-11/12 ml-auto rounded-lg bg-stone-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration Presentation Skeleton (5 cols) */}
        <div className="lg:col-span-5">
          <div className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
            <div className="border-b border-border p-4 bg-stone-50/50 space-y-1.5">
              <Skeleton className="h-4.5 w-36 rounded bg-stone-200" />
              <Skeleton className="h-3 w-60 rounded bg-stone-200/60" />
            </div>
            {/* Tabs Strip */}
            <div className="flex border-b border-border bg-stone-50/40 px-4 pt-2.5 gap-4">
              <Skeleton className="h-6 w-24 rounded bg-stone-200" />
              <Skeleton className="h-6 w-20 rounded bg-stone-200" />
              <Skeleton className="h-6 w-28 rounded bg-stone-200" />
            </div>
            {/* Content Tiles */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <Skeleton className="h-20 rounded-lg bg-stone-50 border border-stone-200/70" />
                <Skeleton className="h-20 rounded-lg bg-stone-50 border border-stone-200/70" />
                <Skeleton className="h-20 rounded-lg bg-stone-50 border border-stone-200/70" />
                <Skeleton className="h-20 rounded-lg bg-stone-50 border border-stone-200/70" />
              </div>
              <Skeleton className="h-16 rounded-lg bg-stone-50 border border-stone-200/70" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Buyer Intent Pipeline Skeleton */}
      <div className="rounded-lg border border-border bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border p-4 bg-stone-50/50">
          <div className="space-y-1.5">
            <Skeleton className="h-4.5 w-52 rounded bg-stone-200" />
            <Skeleton className="h-3 w-72 rounded bg-stone-200/60" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6.5 w-16 rounded-md bg-stone-200" />
            <Skeleton className="h-6.5 w-20 rounded-md bg-stone-200" />
            <Skeleton className="h-6.5 w-16 rounded-md bg-stone-200" />
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <Skeleton className="h-4 w-32 rounded bg-stone-200" />
                  <Skeleton className="h-5 w-24 rounded bg-stone-200" />
                </div>
                <Skeleton className="h-4 w-full rounded bg-stone-100" />
                <Skeleton className="h-12 w-full rounded-lg bg-stone-50" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20 rounded bg-stone-100" />
                  <Skeleton className="h-5 w-24 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
