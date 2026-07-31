"use client";

import { APP_NAME, COMPANY_NAME } from "@/lib/constants";

/**
 * Branded animated auth backdrop — WrapCRM × Wrapify Solutions
 * (no stock video; pure CSS motion)
 */
export function AuthBrandBackground() {
  const marks = [
    APP_NAME,
    COMPANY_NAME,
    "CRM",
    APP_NAME,
    COMPANY_NAME,
    "Clients · Projects · Growth",
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#1a2f4d_0%,#0b1018_42%,#142033_100%)] dark:bg-[linear-gradient(145deg,#060a10_0%,#0b1018_50%,#122038_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(36,84,140,0.45),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_80%,rgba(58,110,165,0.28),transparent_45%)]" />

      {/* Soft grid */}
      <div className="auth-brand-grid absolute inset-0 opacity-[0.18]" />

      {/* Drifting brand orbs */}
      <div className="absolute -left-24 top-10 h-[28rem] w-[28rem] rounded-full bg-[#24548c]/35 blur-3xl animate-float" />
      <div className="absolute -right-20 bottom-0 h-[26rem] w-[26rem] rounded-full bg-[#3a6ea5]/25 blur-3xl animate-float [animation-delay:1.4s]" />
      <div className="absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#d4deea]/10 blur-3xl animate-pulse-soft" />

      {/* Large watermark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="auth-brand-pulse select-none text-center">
          <p className="text-[clamp(3.5rem,14vw,9rem)] font-extrabold tracking-[-0.04em] text-white/[0.07]">
            {APP_NAME}
          </p>
          <p className="-mt-2 text-[clamp(0.85rem,2.4vw,1.35rem)] font-semibold uppercase tracking-[0.35em] text-white/[0.12]">
            {COMPANY_NAME}
          </p>
        </div>
      </div>

      {/* Floating brand chips */}
      <div className="absolute inset-0">
        {marks.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="auth-brand-chip absolute rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold tracking-wide text-white/35 backdrop-blur-sm sm:text-sm"
            style={{
              left: `${8 + ((i * 17) % 70)}%`,
              top: `${12 + ((i * 23) % 68)}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${10 + (i % 4) * 2}s`,
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Top brand bar cue */}
      <div className="absolute left-6 top-6 hidden sm:block">
        <p className="text-sm font-extrabold tracking-tight text-white/55">
          {APP_NAME}
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">
          by {COMPANY_NAME}
        </p>
      </div>

      {/* Readability veil behind form */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(11,16,24,0.35)_0%,rgba(11,16,24,0.55)_55%,rgba(11,16,24,0.72)_100%)]" />
    </div>
  );
}
