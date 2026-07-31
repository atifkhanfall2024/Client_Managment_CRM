import Link from "next/link";
import { getMeetings } from "@/actions/meetings";
import { getProjectOptions } from "@/actions/options";
import { getManagersAndEmployees } from "@/actions/users";
import { requireProfile } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { hasPermission } from "@/lib/rbac";
import { ScheduleMeetingForm } from "@/components/features/schedule-meeting-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Meetings" };
export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "projects.view")) {
    return (
      <p className="text-sm text-muted">You do not have access to meetings.</p>
    );
  }

  const canSchedule = hasPermission(profile.role, "projects.update");
  const [meetings, projects, users] = await Promise.all([
    getMeetings(),
    getProjectOptions(),
    getManagersAndEmployees(),
  ]);
  const managers = users.filter((u) =>
    ["manager", "admin", "super_admin"].includes(u.role)
  );
  const upcoming = meetings.filter((m) => m.status === "scheduled");
  const past = meetings.filter((m) => m.status !== "scheduled");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Client meetings</h1>
        <p className="text-muted">
          Project banana alag hai — meeting yahan (ya project page pe) schedule
          karni padti hai. Client portal pe bhi yeh dikhegi.
        </p>
      </div>

      {canSchedule && (
        <ScheduleMeetingForm
          projects={projects}
          managers={managers.map((m) => ({
            id: m.id,
            full_name: m.full_name,
          }))}
          defaultManagerId={
            profile.role === "manager" ? profile.id : null
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Upcoming{" "}
              <Badge variant="warning" className="ml-2">
                {upcoming.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && (
              <div className="space-y-3 py-6 text-center text-sm text-muted">
                <p className="font-medium text-foreground">
                  Abhi koi meeting nahi
                </p>
                <p>
                  Upar wala form fill karke schedule karein. Sirf project
                  create karne se meeting list me nahi aati.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/projects">View projects</Link>
                </Button>
              </div>
            )}
            {upcoming.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(m.scheduled_at)} · {m.duration_minutes}{" "}
                      min
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {m.project?.name ?? "Project"}
                      {m.manager ? ` · ${m.manager.full_name}` : ""}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/projects/${m.project_id}`}>Open project</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Completed / cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {past.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">
                Past meetings yahan dikhengi.
              </p>
            )}
            {past.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(m.scheduled_at)} · {m.project?.name}
                    </p>
                    {m.notes && (
                      <p className="mt-2 text-sm text-muted">{m.notes}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {m.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
