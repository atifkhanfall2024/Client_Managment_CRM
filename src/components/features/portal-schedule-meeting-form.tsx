"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { portalScheduleMeetingAction } from "@/actions/portal";
import type { ActionResult } from "@/core/types/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Scheduling..." : "Request meeting"}
    </Button>
  );
}

export function PortalScheduleMeetingForm({
  projects,
  managers,
  defaultProjectId,
  defaultManagerId,
}: {
  projects: { id: string; name: string; manager_id?: string | null }[];
  managers: {
    id: string;
    full_name: string;
    label: string;
    project_ids: string[];
  }[];
  defaultProjectId?: string | null;
  defaultManagerId?: string | null;
}) {
  const [state, formAction] = useActionState(
    portalScheduleMeetingAction,
    null as ActionResult | null
  );

  const initialProject =
    defaultProjectId && projects.some((p) => p.id === defaultProjectId)
      ? defaultProjectId
      : projects[0]?.id ?? "";

  const [projectId, setProjectId] = useState(initialProject);

  const suggestedManagerId = useMemo(() => {
    const project = projects.find((p) => p.id === projectId);
    if (project?.manager_id && managers.some((m) => m.id === project.manager_id)) {
      return project.manager_id;
    }
    if (defaultManagerId && managers.some((m) => m.id === defaultManagerId)) {
      return defaultManagerId;
    }
    return managers[0]?.id ?? "";
  }, [projectId, projects, managers, defaultManagerId]);

  const [managerId, setManagerId] = useState(suggestedManagerId);

  // Keep manager in sync when project changes (unless user already picked one for that project)
  function onProjectChange(nextProjectId: string) {
    setProjectId(nextProjectId);
    const project = projects.find((p) => p.id === nextProjectId);
    if (project?.manager_id && managers.some((m) => m.id === project.manager_id)) {
      setManagerId(project.manager_id);
    }
  }

  if (projects.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Request a meeting</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Jab aapka project assign hoga, yahan manager ke sath meeting
            schedule kar sakte ho.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (managers.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Request a meeting</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Abhi koi manager assign nahi. Project manager assign hone ke baad
            aap yahan se meeting request kar sakenge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base">
          Schedule meeting with manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted">
          Pehle project choose karein, phir jis manager se baat karni hai usay
          select karein. Unko email + notification mil jayegi.
        </p>
        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="project_id">Project *</Label>
            <Select
              id="project_id"
              name="project_id"
              required
              value={projectId}
              onChange={(e) => onProjectChange(e.target.value)}
            >
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
          <div className="space-y-2">
            <Label htmlFor="manager_id">Manager *</Label>
            <Select
              id="manager_id"
              name="manager_id"
              required
              value={managerId || suggestedManagerId}
              onChange={(e) => setManagerId(e.target.value)}
            >
              <option value="" disabled>
                Select manager
              </option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
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
              placeholder="Progress review / Questions"
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
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Call / Office" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting_url">Preferred link (optional)</Label>
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
              placeholder="Manager ke sath kya discuss karna hai?"
            />
          </div>
          {state && !state.success && (
            <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>
          )}
          {state?.success && (
            <p className="sm:col-span-2 rounded-lg bg-brand-soft/40 px-3 py-2 text-sm">
              Meeting scheduled — selected manager ko notify kar diya gaya.
            </p>
          )}
          <div className="sm:col-span-2">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
