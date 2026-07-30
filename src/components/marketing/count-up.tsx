"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function CountUp({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
  duration = 1400,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const frames = Math.max(24, Math.round(duration / 16));
    let raf = 0;
    const tick = () => {
      frame += 1;
      const progress = Math.min(1, frame / frames);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (frame < frames) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString();

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
