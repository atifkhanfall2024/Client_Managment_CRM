"use client";

import { useActionState } from "react";
import { createMeetingFromPageAction } from "@/actions/meetings";
import type { ActionResult } from "@/core/types/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ScheduleMeetingForm({
  projects,
  managers,
  defaultManagerId,
}: {
  projects: { id: string; name: string }[];
  managers: { id: string; full_name: string }[];
  defaultManagerId?: string | null;
}) {
  const [state, formAction] = useActionState(
    createMeetingFromPageAction,
    null as ActionResult | null
  );

  if (projects.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Schedule a meeting</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Pehle <span className="font-medium text-foreground">Projects</span>{" "}
            me ek project banao, phir yahan meeting schedule karo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base">Schedule client meeting</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted">
          Project select karke meeting set karein. Client ko dikhne ke liye pehle
          us client pe <span className="font-medium text-foreground">Enable portal</span>{" "}
          + Admin <span className="font-medium text-foreground">Approve</span>{" "}
          hona zaroori hai — phir client{" "}
          <span className="font-medium text-foreground">/portal</span> pe login
          karke Meetings dekhega.
        </p>
        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="project_id">Project *</Label>
            <Select id="project_id" name="project_id" required defaultValue="">
              <option value="" disabled>
                Select project
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Progress review / Kickoff"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Date & time *</Label>
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
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Office / Call" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="meeting_url">Meeting link</Label>
            <Input
              id="meeting_url"
              name="meeting_url"
              placeholder="https://meet.google.com/..."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea
              id="agenda"
              name="agenda"
              rows={3}
              placeholder="Client ke sath kya discuss hoga?"
            />
          </div>
          <input type="hidden" name="visible_to_client" value="true" />
          {state && !state.success && (
            <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>
          )}
          {state?.success && (
            <p className="sm:col-span-2 rounded-lg bg-brand-soft/40 px-3 py-2 text-sm">
              Meeting scheduled — neeche Upcoming list me dekho.
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit">Schedule meeting</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
