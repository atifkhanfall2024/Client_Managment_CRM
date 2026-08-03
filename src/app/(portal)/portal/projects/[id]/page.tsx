import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ListTodo,
  UserRound,
} from "lucide-react";
import { getPortalProject, getPortalProjects, getPortalMeetingManagers } from "@/actions/portal";
import { DocumentUploader } from "@/components/features/document-uploader";
import { PortalScheduleMeetingForm } from "@/components/features/portal-schedule-meeting-form";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data;
  try {
    data = await getPortalProject(id);
  } catch {
    notFound();
  }

  const { project, tasks, meetings, manager, taskStats } = data;
  const [projects, managers] = await Promise.all([
    getPortalProjects(),
    getPortalMeetingManagers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
          <Link href="/portal/projects">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {project.name}
            </h1>
            <p className="mt-1 text-muted">
              {project.description || "No description provided."}
            </p>
            {manager && (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <UserRound className="h-4 w-4 text-brand" />
                Manager:{" "}
                <span className="font-medium text-foreground">
                  {manager.full_name}
                </span>
              </p>
            )}
          </div>
          <Badge variant="secondary" className="capitalize">
            {project.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted">Work progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-brand">
              {project.progress}%
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-brand-soft/60">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${Math.min(100, project.progress)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              Last updated {formatDate(project.updated_at)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted">Budget</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCurrency(project.budget)}
          </CardContent>
          {data.client?.budget != null &&
            Number(data.client.budget) > 0 &&
            Number(project.budget) !== Number(data.client.budget) && (
              <p className="px-6 pb-4 text-xs text-muted">
                Account budget {formatCurrency(data.client.budget)}
              </p>
            )}
        </Card>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted">Deadline</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {project.deadline || "—"}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListTodo className="h-4 w-4 text-brand" /> Task progress breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(
              [
                ["Total", taskStats.total],
                ["To do", taskStats.todo],
                ["In progress", taskStats.in_progress],
                ["Review", taskStats.review],
                ["Done", taskStats.done],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-brand-soft/20 px-3 py-3 text-center"
              >
                <p className="text-2xl font-extrabold text-foreground">{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Task board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 && (
              <p className="text-sm text-muted">No tasks published yet.</p>
            )}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-border px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{task.title}</p>
                  <Badge variant="outline" className="capitalize">
                    {task.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                {task.description && (
                  <p className="mt-1 text-xs text-muted">{task.description}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {task.due_date ? `Due ${task.due_date}` : "No due date"} ·{" "}
                  <span className="capitalize">{task.priority}</span> priority
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-brand" /> Meetings with
              manager
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meetings.length === 0 && (
              <p className="text-sm text-muted">
                Abhi koi meeting schedule nahi. Manager jab meeting set karega
                yahan dikhegi.
              </p>
            )}
            {meetings.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-border px-3 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(m.scheduled_at)} · {m.duration_minutes} min
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {m.status}
                  </Badge>
                </div>
                {m.agenda && (
                  <p className="mt-2 text-sm text-muted">Agenda: {m.agenda}</p>
                )}
                {m.notes && (
                  <p className="mt-2 rounded-lg bg-brand-soft/30 px-3 py-2 text-sm">
                    Discussion notes: {m.notes}
                  </p>
                )}
                {m.meeting_url && m.status === "scheduled" && (
                  <a
                    href={m.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
                  >
                    Join meeting
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <PortalScheduleMeetingForm
        projects={projects.map((p) => ({
          id: p.id,
          name: p.name,
          manager_id: p.manager_id,
        }))}
        managers={managers}
        defaultProjectId={project.id}
        defaultManagerId={manager?.id ?? null}
      />

      <DocumentUploader entityType="project" entityId={project.id} />
    </div>
  );
}
