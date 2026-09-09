import { Container } from "@/components/layout/container";

export default function AppLoading() {
  return (
    <Container size="lg" className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 pb-3 pt-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-md bg-stone-200" />
          <div className="h-4 w-64 rounded-md bg-stone-100" />
        </div>
        <div className="h-8 w-28 rounded-md bg-stone-200" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-stone-200 bg-white p-4.5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 rounded bg-stone-200" />
              <div className="h-4 w-4 rounded bg-stone-200" />
            </div>
            <div className="h-7 w-16 rounded bg-stone-200" />
            <div className="h-3 w-32 rounded bg-stone-100" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="h-80 rounded-xl border border-stone-200 bg-white p-6 space-y-4">
        <div className="h-5 w-48 rounded bg-stone-200" />
        <div className="h-4 w-72 rounded bg-stone-100" />
        <div className="h-48 w-full rounded-lg bg-stone-50 border border-stone-100" />
      </div>
    </Container>
  );
}
