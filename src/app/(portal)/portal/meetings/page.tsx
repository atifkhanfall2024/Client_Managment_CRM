import Link from "next/link";
import { getPortalMeetings } from "@/actions/portal";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "My Meetings" };
export const dynamic = "force-dynamic";

export default async function PortalMeetingsPage() {
  const meetings = await getPortalMeetings();
  const upcoming = meetings.filter((m) => m.status === "scheduled");
  const past = meetings.filter((m) => m.status !== "scheduled");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">My meetings</h1>
        <p className="text-muted">
          Aapke project manager ke sath scheduled discussions yahan dikhti hain.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>
            Upcoming{" "}
            <Badge variant="warning" className="ml-2">
              {upcoming.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              Abhi koi upcoming meeting nahi. Jab manager schedule karega, yahan
              dikhegi.
            </p>
          )}
          {upcoming.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{m.title}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(m.scheduled_at)} · {m.duration_minutes} min
                    · {m.project_name}
                  </p>
                  {m.agenda && (
                    <p className="mt-2 text-sm text-muted">Agenda: {m.agenda}</p>
                  )}
                  {m.meeting_url && (
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
                <Button asChild size="sm" variant="outline">
                  <Link href={`/portal/projects/${m.project_id}`}>
                    View progress
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Past meetings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {past.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              Completed meetings yahan dikhengi.
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
                    {formatDateTime(m.scheduled_at)} · {m.project_name}
                  </p>
                  {m.notes && (
                    <p className="mt-2 rounded-lg bg-brand-soft/30 px-3 py-2 text-sm">
                      Notes: {m.notes}
                    </p>
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
  );
}
