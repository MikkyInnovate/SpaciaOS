import { SpaciaMark } from "@/components/brand/spacia-logo";

/* Route loading screen (dashboard and app pages). Pure CSS so it animates before any
   JavaScript runs: the SpaciaOS mark breathes and a light sweeps along a pixel bar. */

const CELLS = 18;

export function WorkspaceLoading({ label = "Loading your workspace" }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen w-full select-none flex-col items-center justify-center bg-[#f4f4f2] px-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-full max-w-[220px] flex-col items-center text-center">
        <span className="loader-breathe text-[#14231d]">
          <SpaciaMark className="h-9 w-9" />
        </span>
        <div className="mt-7 grid w-full gap-[3px]" style={{ gridTemplateColumns: `repeat(${CELLS}, minmax(0, 1fr))` }} aria-hidden="true">
          {Array.from({ length: CELLS }).map((_, i) => (
            <span key={i} className="loader-cell h-1.5 bg-zinc-200" style={{ animationDelay: `${(i * 0.06).toFixed(2)}s` }} />
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      </div>
    </div>
  );
}
