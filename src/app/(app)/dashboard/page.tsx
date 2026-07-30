import Link from "next/link";
import {
  Users,
  FolderKanban,
  CheckSquare,
  DollarSign,
  Plus,
  UserCheck,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { getPendingUsers } from "@/actions/approvals";
import { requireProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedStat } from "@/components/features/animated-stat";
import {
  PipelineAreaChart,
  StatusBarChart,
  StatusPieChart,
} from "@/components/features/dashboard-charts";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const stats = await getDashboardStats();
  const pending = ["super_admin", "admin", "manager"].includes(profile.role)
    ? await getPendingUsers()
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            {APP_NAME} workspace
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted">
            Hello {profile.full_name} — live overview of your client operations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pending.length > 0 && (
            <Button asChild variant="outline">
              <Link href="/approvals">
                <UserCheck className="h-4 w-4" />
                {pending.length} pending
              </Link>
            </Button>
          )}
          {hasPermission(profile.role, "clients.create") && (
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="h-4 w-4" /> New Client
              </Link>
            </Button>
          )}
          {hasPermission(profile.role, "projects.create") && (
            <Button asChild variant="outline">
              <Link href="/projects/new">
                <Plus className="h-4 w-4" /> New Project
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AnimatedStat
          label="Total Clients"
          value={stats.total_clients}
          accent="bg-brand"
          icon={<Users className="h-4 w-4" />}
        />
        <AnimatedStat
          label="Active Clients"
          value={stats.active_clients}
          accent="bg-[#3a6ea5]"
          icon={<Briefcase className="h-4 w-4" />}
        />
        <AnimatedStat
          label="Active Projects"
          value={stats.active_projects}
          accent="bg-[#1a2332] dark:bg-[#7c9bc2]"
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <AnimatedStat
          label="Completed Projects"
          value={stats.completed_projects}
          accent="bg-[#3d6a9f]"
          icon={<FolderKanban className="h-4 w-4" />}
        />
        <AnimatedStat
          label="Pending Tasks"
          value={stats.pending_tasks}
          accent="bg-[#5c6b7a]"
          icon={<CheckSquare className="h-4 w-4" />}
        />
        <AnimatedStat
          label="Pipeline Value"
          value={formatCurrency(stats.pipeline_value)}
          accent="bg-brand"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 text-sm text-muted sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          Planning projects:{" "}
          <span className="font-semibold text-foreground">
            {stats.planning_projects}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          In progress:{" "}
          <span className="font-semibold text-foreground">
            {stats.in_progress_projects}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          Completed revenue:{" "}
          <span className="font-semibold text-foreground">
            {formatCurrency(stats.revenue)}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <StatusPieChart
              title="Clients by status"
              data={stats.clients_by_status}
            />
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <StatusBarChart
              title="Projects by status"
              data={stats.projects_by_status}
            />
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <PipelineAreaChart
              title="Tasks by status"
              data={stats.tasks_by_status}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-rise border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Live projects</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recent_projects.length === 0 && (
              <p className="text-sm text-muted">No projects yet.</p>
            )}
            {stats.recent_projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-xl border border-border bg-card/60 p-3 transition hover:border-brand/40 hover:bg-brand-soft/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{project.name}</p>
                    <p className="text-xs text-muted">{project.client_name}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {project.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-soft/60">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-700"
                      style={{ width: `${Math.min(100, project.progress)}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-rise border-border shadow-sm">
          <CardHeader>
            <CardTitle>Team performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.employee_performance.length === 0 && (
              <p className="text-sm text-muted">
                Assign tasks to employees to see performance here.
              </p>
            )}
            {stats.employee_performance.map((emp) => {
              const pct =
                emp.total === 0 ? 0 : Math.round((emp.done / emp.total) * 100);
              return (
                <div key={emp.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{emp.name}</span>
                    <span className="text-muted">
                      {emp.done}/{emp.total} done ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-soft/60">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="animate-rise border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent activity</CardTitle>
          {hasPermission(profile.role, "activity.view") && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/activity">View all</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.recent_activity.length === 0 && (
            <p className="text-sm text-muted">No activity yet.</p>
          )}
          {stats.recent_activity.map((log) => (
            <div
              key={String(log.id)}
              className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {(log.actor as { full_name?: string } | null)?.full_name ??
                    "System"}{" "}
                  <span className="font-normal text-muted">
                    {String(log.action)} {String(log.entity_type)}
                  </span>
                </p>
                <p className="text-xs text-muted">
                  {formatDate(String(log.created_at))}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {String(log.entity_type)}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
