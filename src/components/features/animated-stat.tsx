"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AnimatedStat({
  value,
  label,
  icon,
  accent,
}: {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  accent: string;
}) {
  const numeric = typeof value === "number" ? value : null;
  const [display, setDisplay] = useState(numeric === null ? value : 0);

  useEffect(() => {
    if (numeric === null) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const frames = 36;
    const tick = () => {
      frame += 1;
      const progress = Math.min(1, frame / frames);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(numeric * eased));
      if (frame < frames) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [numeric, value]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 opacity-90 transition group-hover:h-1.5",
          accent
        )}
      />
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <div className="rounded-xl bg-brand-soft p-2 text-brand">{icon}</div>
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-foreground">
        {display}
      </p>
    </div>
  );
}
