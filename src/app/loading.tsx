import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <LoadingSpinner size="lg" label="Initializing Spacia..." />
    </div>
  );
}
