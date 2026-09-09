import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-6">
          <FileQuestion className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Page Not Found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The view or resource you requested does not exist or has been relocated.
        </p>
        <div className="mt-6">
          <Button asChild className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back to Overview</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
