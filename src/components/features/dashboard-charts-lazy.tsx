"use client";

import dynamic from "next/dynamic";

const Panel = dynamic(
  () =>
    import("@/components/features/dashboard-charts-panel").then(
      (m) => m.DashboardChartsPanel
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6">
        <div className="h-72 animate-pulse rounded-2xl bg-muted/40" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
          <div className="h-64 animate-pulse rounded-2xl bg-muted/40" />
        </div>
      </div>
    ),
  }
);

type Slice = { name: string; value: number; key?: string };
type Trend = { name: string; clients: number; projects: number };
type Perf = { name: string; total: number; done: number };

export function DashboardChartsLazy(
  props: {
    monthly_trend: Trend[];
    project_completion_rate: number;
    completion_rate: number;
    clients_by_status: Slice[];
    projects_by_status: Slice[];
    tasks_by_status: Slice[];
    budget_mix: Slice[];
    progress_leaders: Slice[];
    employee_performance: Perf[];
    showFinance?: boolean;
    showClients?: boolean;
  }
) {
  return <Panel {...props} />;
}
