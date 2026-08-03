"use client";

import { APP_NAME, COMPANY_NAME } from "@/lib/constants";

/** Lightweight branded auth backdrop (minimal paint / blur). */
export function AuthBrandBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#1a2f4d_0%,#0b1018_45%,#142033_100%)] dark:bg-[linear-gradient(145deg,#060a10_0%,#0b1018_55%,#122038_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(36,84,140,0.4),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_80%,rgba(58,110,165,0.22),transparent_50%)]" />
      <div className="auth-brand-grid absolute inset-0 opacity-[0.14]" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="select-none text-center">
          <p className="text-[clamp(3.5rem,14vw,9rem)] font-extrabold tracking-[-0.04em] text-white/[0.07]">
            {APP_NAME}
          </p>
          <p className="-mt-2 text-[clamp(0.85rem,2.4vw,1.35rem)] font-semibold uppercase tracking-[0.35em] text-white/[0.12]">
            {COMPANY_NAME}
          </p>
        </div>
      </div>

      <div className="absolute left-6 top-6 hidden sm:block">
        <p className="text-sm font-extrabold tracking-tight text-white/55">
          {APP_NAME}
        </p>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">
          by {COMPANY_NAME}
        </p>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(11,16,24,0.3)_0%,rgba(11,16,24,0.55)_60%,rgba(11,16,24,0.7)_100%)]" />
    </div>
  );
}
