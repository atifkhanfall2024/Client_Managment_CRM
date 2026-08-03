"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  BudgetMixChart,
  CompletionGauge,
  MonthlyTrendChart,
  PipelineAreaChart,
  ProgressLeadersChart,
  StatusBarChart,
  StatusPieChart,
  TeamPerformanceChart,
} from "@/components/features/dashboard-charts";

type Slice = { name: string; value: number; key?: string };
type Trend = { name: string; clients: number; projects: number };
type Perf = { name: string; total: number; done: number };

export function DashboardChartsPanel({
  monthly_trend,
  project_completion_rate,
  completion_rate,
  clients_by_status,
  projects_by_status,
  tasks_by_status,
  budget_mix,
  progress_leaders,
  employee_performance,
  showFinance = true,
  showClients = true,
}: {
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
}) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border shadow-sm lg:col-span-3">
          <CardContent className="pt-6">
            <MonthlyTrendChart
              title="6-month growth trend"
              data={monthly_trend}
            />
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm lg:col-span-2">
          <CardContent className="grid gap-2 pt-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <CompletionGauge
              value={project_completion_rate}
              title="Project completion"
              subtitle="Completed vs all projects"
            />
            <CompletionGauge
              value={completion_rate}
              title="Task completion"
              subtitle="Done vs all tasks"
            />
          </CardContent>
        </Card>
      </div>

      <div
        className={`grid gap-6 ${showClients ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}
      >
        {showClients && (
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <StatusPieChart
                title="Clients by status"
                data={clients_by_status}
              />
            </CardContent>
          </Card>
        )}
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <StatusBarChart
              title="Projects by status"
              data={projects_by_status}
            />
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <PipelineAreaChart
              title="Tasks by status"
              data={tasks_by_status}
            />
          </CardContent>
        </Card>
      </div>

      <div className={`grid gap-6 ${showFinance ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {showFinance && (
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <BudgetMixChart
                title="Pipeline vs completed revenue"
                data={budget_mix}
              />
            </CardContent>
          </Card>
        )}
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <ProgressLeadersChart
              title="Active project progress"
              data={progress_leaders}
            />
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <TeamPerformanceChart
              title="Team task performance"
              data={employee_performance}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
