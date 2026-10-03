import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SpaciaLogo } from "@/components/brand/spacia-logo";
import { Tile404 } from "@/components/brand/tile-404";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#f4f4f2] px-5 py-5 sm:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="SpaciaOS home">
          <SpaciaLogo className="text-[19px]" />
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">Error 404</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <Tile404 />
        <h1 className="font-display mt-12 text-[clamp(30px,3.4vw,44px)] font-light leading-[1.05] tracking-[-0.035em] text-[#14231d]">
          This page went cold.
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-500">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Unlike your leads, it won&apos;t get a call
          back.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-zinc-950 px-5 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-white transition-colors duration-300 hover:bg-[#15803d]"
          >
            Back to home <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/waitlist"
            className="inline-flex items-center gap-2 bg-white px-5 py-3 font-mono text-[12px] uppercase tracking-[0.12em] text-zinc-800 ring-1 ring-zinc-300 transition-colors duration-300 hover:text-[#15803d] hover:ring-[#15803d]"
          >
            Join the waitlist
          </Link>
        </div>
      </main>
    </div>
  );
}
