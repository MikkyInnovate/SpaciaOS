import { Container } from "@/components/layout/container";

export default function DashboardLoading() {
  return (
    <Container className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 pb-6 pt-2 sm:flex-row sm:items-center sm:justify-between border-b border-border">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-md bg-muted" />
          <div className="h-4 w-72 rounded-md bg-muted/60" />
        </div>
        <div className="h-9 w-32 rounded-md bg-muted" />
      </div>

      {/* Grid Skeletons */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 rounded-lg border border-border bg-card p-6 space-y-4"
          >
            <div className="h-5 w-1/3 rounded-md bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded-md bg-muted/60" />
              <div className="h-4 w-4/5 rounded-md bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
