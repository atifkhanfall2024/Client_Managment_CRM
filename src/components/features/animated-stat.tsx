"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function AnimatedStat({
  value,
  label,
  icon,
  accent,
  href,
}: {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  accent: string;
  href?: string;
}) {
  const body = (
    <>
      <div className={cn("absolute inset-x-0 top-0 h-1 opacity-90", accent)} />
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <div className="rounded-xl bg-brand-soft p-2 text-brand">{icon}</div>
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-foreground">
        {value}
      </p>
      {href && (
        <p className="mt-2 text-xs font-medium text-brand opacity-0 transition group-hover:opacity-100">
          View details →
        </p>
      )}
    </>
  );

  const className = cn(
    "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
    href && "block cursor-pointer hover:border-brand/40"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
