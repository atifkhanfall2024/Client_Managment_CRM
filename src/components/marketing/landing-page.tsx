"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckSquare,
  FolderKanban,
  ShieldCheck,
  Users,
  UserCheck,
  FileText,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { APP_NAME, APP_TAGLINE, APP_BYLINE, COMPANY_NAME, COMPANY_URL } from "@/lib/constants";
import { CountUp } from "@/components/marketing/count-up";
import { HeroVideoBackground } from "@/components/marketing/hero-video";

const stats: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
}[] = [
  { label: "Teams onboarded", value: 1200, suffix: "+" },
  { label: "Active projects tracked", value: 48000, suffix: "+" },
  { label: "Tasks completed", value: 2.4, suffix: "M+", decimals: 1 },
  { label: "Approval accuracy", value: 99, suffix: "%" },
];

const modules = [
  {
    title: "Clients & Companies",
    text: "Centralize accounts, contacts, and pipeline status with clear ownership.",
    icon: Users,
  },
  {
    title: "Projects & Delivery",
    text: "Track scope, progress, and outcomes from planning through completion.",
    icon: FolderKanban,
  },
  {
    title: "Tasks & Accountability",
    text: "Assign work, monitor deadlines, and measure employee performance.",
    icon: CheckSquare,
  },
  {
    title: "Documents & Activity",
    text: "Store files beside records and keep a full audit trail of changes.",
    icon: FileText,
  },
  {
    title: "Reports & Insights",
    text: "See revenue, workload, and completion trends in one workspace view.",
    icon: BarChart3,
  },
  {
    title: "Secure Approvals",
    text: "Role-gated onboarding keeps Super Admin, Admin, and Managers in control.",
    icon: ShieldCheck,
  },
];

const hierarchy = [
  {
    role: "Super Admin",
    detail: "Owns the workspace. Approves Admins and sets top-level policy.",
  },
  {
    role: "Admin",
    detail: "Controls Managers and Employees. Approves team registrations.",
  },
  {
    role: "Manager",
    detail: "Runs delivery squads. Approves Employees under their control.",
  },
  {
    role: "Employee",
    detail: "Executes assigned clients, projects, and tasks with clear visibility.",
  },
];

const ticker = [
  "Client pipeline",
  "Project tracking",
  "Task boards",
  "Document vault",
  "Team approvals",
  "Live activity",
  "Performance reports",
  "Role-based access",
];

export function LandingPage() {
  return (
    <main className="mesh-bg relative min-h-screen overflow-x-hidden text-foreground">
      <section className="relative isolate min-h-[100svh] overflow-hidden">
        <HeroVideoBackground />

        <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-2xl font-extrabold tracking-[0.02em] text-brand dark:text-[#d4deea]"
          >
            {APP_NAME}
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/70 md:flex dark:text-[#d4deea]/75">
            <a href="#stats" className="transition hover:text-brand dark:hover:text-[#d4deea]">
              Results
            </a>
            <a href="#platform" className="transition hover:text-brand dark:hover:text-[#d4deea]">
              Platform
            </a>
            <a href="#control" className="transition hover:text-brand dark:hover:text-[#d4deea]">
              Control
            </a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle className="text-foreground hover:bg-brand-soft dark:text-[#d4deea] dark:hover:bg-white/10 dark:hover:text-[#d4deea]" />
            <Button asChild variant="ghost" className="text-foreground dark:text-[#d4deea] dark:hover:bg-white/10 dark:hover:text-[#d4deea]">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5.5rem)] max-w-6xl flex-col justify-center px-6 pb-20 pt-8">
          <div className="animate-fade-up max-w-2xl rounded-3xl border border-[#c5d4e6] bg-[#f7fafc]/95 p-8 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-10 dark:border-white/10 dark:bg-[#141b26]/75 dark:shadow-none">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand">
              {COMPANY_NAME}
            </p>
            <h1 className="mt-3 text-5xl font-extrabold leading-[1.02] tracking-tight text-[#0f172a] sm:text-6xl lg:text-7xl dark:text-foreground">
              {APP_NAME}
            </h1>
            <p className="mt-2 text-sm font-medium text-[#475569] dark:text-muted">{APP_BYLINE}</p>
            <p className="mt-4 max-w-xl text-xl font-medium text-[#1e293b] sm:text-2xl dark:text-foreground/90">
              {APP_TAGLINE}
            </p>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#475569] sm:text-lg dark:text-muted">
              Run clients, projects, and teams with approval-gated access — built
              for Super Admin, Admin, Manager, and Employee control.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-7 text-base">
                <Link href="/register">
                  Start free workspace <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base"
              >
                <Link href="/login">Sign in to workspace</Link>
              </Button>
            </div>
          </div>

          <div
            className="animate-fade-up mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            style={{ animationDelay: "160ms" }}
          >
            {[
              ["Pipeline health", "94%"],
              ["On-time delivery", "87%"],
              ["Team utilization", "76%"],
              ["Approval accuracy", "99%"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[#c5d4e6] bg-[#f7fafc]/95 px-4 py-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#141b26]/65"
              >
                <p className="text-xs uppercase tracking-wider text-[#64748b] dark:text-muted">{label}</p>
                <p className="mt-1 text-2xl font-extrabold text-brand dark:text-[#e6ebf2]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative z-10 border-y border-border bg-card/80 py-4 backdrop-blur-sm">
        <div className="overflow-hidden">
          <div className="animate-marquee flex w-max gap-10 whitespace-nowrap px-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted">
            {[...ticker, ...ticker].map((item, i) => (
              <span key={`${item}-${i}`} className="flex items-center gap-10">
                {item}
                <span className="h-1 w-1 rounded-full bg-brand" />
              </span>
            ))}
          </div>
        </div>
      </div>

      <section id="stats" className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl animate-rise">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
            By the numbers
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Proven structure for client-heavy teams
          </h2>
          <p className="mt-3 text-muted">
            {APP_NAME} gives organizations visibility across accounts, delivery,
            and people — without losing control of who can join or act.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="animate-fade-up rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur-sm"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <p className="text-sm font-medium text-muted">{stat.label}</p>
              <p className="mt-3 text-4xl font-extrabold tracking-tight text-brand">
                <CountUp
                  value={stat.value}
                  suffix={stat.suffix}
                  decimals={stat.decimals ?? 0}
                />
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="relative z-10 bg-[#1a2332] py-20 text-[#e6ebf2] dark:bg-[#141b26]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7c9bc2]">
              Platform
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything your client operation needs
            </h2>
            <p className="mt-3 text-[#9aa8b8]">
              One workspace for commercial relationships and delivery execution —
              connected, searchable, and permissioned.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.title}
                  className="group animate-fade-up rounded-2xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/10"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#2c5282]/40 text-[#d4deea] transition group-hover:bg-[#d4deea] group-hover:text-[#1a2332]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold">{mod.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#9aa8b8]">
                    {mod.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="control" className="relative z-10 bg-surface/60 px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">
              Access control
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Hierarchy that protects the workspace
            </h2>
            <p className="mt-4 text-muted">
              New accounts stay pending until the right leader approves them. No
              dashboard access until verification — Managers under Admin,
              Employees under controlled teams.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <UserCheck className="h-4 w-4 text-brand" />
                Approval-gated onboarding
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <Building2 className="h-4 w-4 text-brand" />
                Company-level visibility
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {hierarchy.map((item, i) => (
              <div
                key={item.role}
                className="animate-fade-up flex gap-4 rounded-2xl border border-border bg-card p-5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-[#f7f9fc] dark:text-[#0b1018]">
                  {i + 1}
                </div>
                <div>
                  <p className="font-bold text-foreground">{item.role}</p>
                  <p className="mt-1 text-sm text-muted">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-border bg-card py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand">
                <Activity className="h-4 w-4" /> End-to-end operations
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                From first lead to delivered work
              </h2>
              <p className="text-muted">
                Capture clients, attach companies, open projects, break work into
                tasks, store documents, and monitor activity — then report on what
                moved the business forward.
              </p>
              <ul className="space-y-3 pt-2 text-sm text-foreground/80">
                {[
                  "Soft-delete safety and audit-friendly activity logs",
                  "Role permissions for create, edit, and management actions",
                  "Full light and dark themes for long working sessions",
                  "Notifications when accounts are approved or work changes",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-[#1a2332] p-8 text-[#e6ebf2] dark:bg-brand-soft sm:p-10">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#2c5282]/40 blur-2xl animate-pulse-soft" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7c9bc2]">
                Ready when you are
              </p>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight">
                Launch your {APP_NAME} workspace today
              </h3>
              <p className="mt-3 max-w-md text-[#9aa8b8]">
                Create an account, wait for the correct approver, and start running
                client operations with a professional command structure.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 bg-[#d4deea] text-[#1a2332] hover:bg-[#e8eef4]"
                >
                  <Link href="/register">Create account</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 border-[#d4deea]/30 bg-transparent text-[#d4deea] hover:bg-white/10 hover:text-[#e6ebf2]"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border bg-background py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-foreground">{APP_NAME}</p>
            <p className="text-xs text-muted">{APP_BYLINE}</p>
          </div>
          <a
            href={COMPANY_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted transition hover:text-brand"
          >
            {COMPANY_NAME}
          </a>
        </div>
      </footer>
    </main>
  );
}
