"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  cancelMeetingAction,
  completeMeetingWithNotesAction,
  createMeetingAction,
} from "@/actions/meetings";
import type { ActionResult } from "@/core/types/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

type MeetingRow = {
  id: string;
  title: string;
  agenda: string | null;
  notes: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  meeting_url: string | null;
  status: string;
  manager?: { full_name: string } | null;
};

function SubmitMeetingButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Scheduling..." : "Schedule meeting"}
    </Button>
  );
}

export function ProjectMeetingsPanel({
  projectId,
  managers,
  defaultManagerId,
  meetings,
  canManage,
}: {
  projectId: string;
  managers: { id: string; full_name: string }[];
  defaultManagerId?: string | null;
  meetings: MeetingRow[];
  canManage: boolean;
}) {
  const [state, formAction] = useActionState(
    async (prev: ActionResult | null, formData: FormData) =>
      createMeetingAction(projectId, prev, formData),
    null as ActionResult | null
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {canManage && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Schedule client meeting</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted">
              Manager aur client is project pe time-to-time discuss kar sakte
              hain. Client portal pe meeting + progress dono dikhengi.
            </p>
            <form action={formAction} className="grid gap-3">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Progress review / Kickoff"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduled_at">Date & time</Label>
                  <Input
                    id="scheduled_at"
                    name="scheduled_at"
                    type="datetime-local"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_minutes">Duration (min)</Label>
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min={15}
                    max={480}
                    defaultValue={30}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager_id">Manager</Label>
                <Select
                  id="manager_id"
                  name="manager_id"
                  defaultValue={defaultManagerId ?? ""}
                >
                  <option value="">Select manager</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Office / Call"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting_url">Meeting link</Label>
                  <Input
                    id="meeting_url"
                    name="meeting_url"
                    placeholder="https://meet..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agenda">Agenda</Label>
                <Textarea
                  id="agenda"
                  name="agenda"
                  rows={3}
                  placeholder="What will you discuss with the client?"
                />
              </div>
              <input type="hidden" name="visible_to_client" value="true" />
              {state && !state.success && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}
              {state?.success && (
                <p className="rounded-lg bg-brand-soft/40 px-3 py-2 text-sm">
                  Meeting scheduled. Client portal pe bhi dikhegi.
                </p>
              )}
              <SubmitMeetingButton />
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Project meetings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {meetings.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              Abhi koi meeting nahi. Client ke sath progress discuss karne ke
              liye schedule karein.
            </p>
          )}
          {meetings.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{m.title}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(m.scheduled_at)} · {m.duration_minutes} min
                    {m.manager ? ` · ${m.manager.full_name}` : ""}
                  </p>
                </div>
                  <Badge variant="secondary" className="capitalize">
                    {m.notes?.startsWith("Auto-closed") ? "expired" : m.status}
                  </Badge>
              </div>
              {m.agenda && (
                <p className="mt-2 text-sm text-muted">{m.agenda}</p>
              )}
              {m.notes && (
                <p className="mt-2 rounded-lg bg-brand-soft/30 px-3 py-2 text-sm">
                  Notes: {m.notes}
                </p>
              )}
              {(m.location || m.meeting_url) && (
                <p className="mt-2 text-xs text-muted">
                  {m.location ? `📍 ${m.location}` : ""}
                  {m.location && m.meeting_url ? " · " : ""}
                  {m.meeting_url ? (
                    <a
                      href={m.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline"
                    >
                      Join link
                    </a>
                  ) : null}
                </p>
              )}
              {canManage && m.status === "scheduled" && (
                <div className="mt-3 space-y-2">
                  <form
                    action={completeMeetingWithNotesAction.bind(null, m.id)}
                    className="flex w-full flex-col gap-2 sm:flex-row"
                  >
                    <Input
                      name="notes"
                      placeholder="Discussion summary for client"
                      className="h-9"
                    />
                    <Button type="submit" size="sm">
                      Mark completed
                    </Button>
                  </form>
                  <form action={cancelMeetingAction.bind(null, m.id)}>
                    <Button type="submit" size="sm" variant="outline">
                      Cancel meeting
                    </Button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
