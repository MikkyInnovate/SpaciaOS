import { SpaciaMark } from "@/components/brand/spacia-logo";

/* First-visit intro for the landing page: the counter runs 00 → 100 while a pixel bar
   fills, then the screen slides away. Pure CSS (works before hydration). Shown once per
   browser session; skipped entirely for reduced-motion visitors. */

const CELLS = 24;

export function LandingIntro() {
  return (
    <div className="intro-overlay fixed inset-0 z-[100] flex items-center justify-center bg-[#f4f4f2] px-5" aria-hidden="true">
      {/* hide instantly if this session has already seen the intro */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(sessionStorage.getItem('spacia-intro')){document.documentElement.setAttribute('data-intro-seen','')}else{sessionStorage.setItem('spacia-intro','1')}}catch(e){}",
        }}
      />
      <div className="flex w-full max-w-[280px] flex-col items-center text-center">
        <span className="intro-mark text-[#14231d]">
          <SpaciaMark className="h-10 w-10" />
        </span>
        <div className="mt-6 flex items-start font-display text-[72px] font-light leading-none tracking-[-0.05em] text-[#14231d] tabular-nums">
          <span className="intro-count" />
          <span className="mt-2 text-[24px] text-[#15803d]">%</span>
        </div>
        <div className="mt-6 grid w-full gap-[3px]" style={{ gridTemplateColumns: `repeat(${CELLS}, minmax(0, 1fr))` }}>
          {Array.from({ length: CELLS }).map((_, i) => (
            <span key={i} className="intro-cell h-2 bg-zinc-200" style={{ animationDelay: `${((i / CELLS) * 1.3).toFixed(2)}s` }} />
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">Every lead, answered</p>
      </div>
    </div>
  );
}
