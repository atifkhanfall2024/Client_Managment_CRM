"use client";

import { useRouter } from "next/navigation";
import { FormShell } from "@/components/forms/form-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PRIORITIES, PROJECT_STATUSES } from "@/lib/constants";
import type { ActionResult } from "@/core/types/result";
import type { Project } from "@/types/database";

export function ProjectForm({
  action,
  clients,
  managers,
  employees,
  project,
  defaultManagerId,
  showBudget = true,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  clients: { id: string; name: string }[];
  managers: { id: string; full_name: string }[];
  employees: { id: string; full_name: string }[];
  project?: {
    id?: string;
    name?: string;
    client_id?: string;
    description?: string | null;
    budget?: number | null;
    deadline?: string | null;
    priority?: Project["priority"];
    status?: Project["status"];
    progress?: number;
    manager_id?: string | null;
    members?: { user_id: string }[];
    updated_at?: string;
  };
  defaultManagerId?: string;
  showBudget?: boolean;
}) {
  const router = useRouter();
  const selectedMembers = project?.members?.map((m) => m.user_id) ?? [];
  const isEdit = Boolean(project?.id);

  return (
    <Card>
      <CardContent className="pt-6">
        <FormShell
          key={project?.updated_at ?? "new"}
          action={action}
          submitLabel={isEdit ? "Update Project" : "Create Project"}
          onSuccess={() => {
            if (isEdit) {
              router.refresh();
            } else {
              router.push("/projects");
            }
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          {isEdit && (
            <input type="hidden" name="id" value={project?.id ?? ""} />
          )}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input id="name" name="name" required defaultValue={project?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_id">Client *</Label>
            <Select
              id="client_id"
              name="client_id"
              required
              defaultValue={project?.client_id ?? ""}
            >
              <option value="" disabled>
                Select client
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager_id">Manager</Label>
            <Select
              id="manager_id"
              name="manager_id"
              defaultValue={project?.manager_id ?? defaultManagerId ?? ""}
            >
              <option value="">Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </Select>
          </div>
          {showBudget ? (
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                min={0}
                defaultValue={project?.budget ?? 0}
              />
            </div>
          ) : (
            <input type="hidden" name="budget" value={project?.budget ?? 0} />
          )}
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={project?.deadline ?? ""}
            />
          </div>
          <div className="sm:col-span-2 rounded-xl border border-brand/20 bg-brand-soft/20 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Status · Progress · Priority
            </p>
            <p className="mb-4 text-xs text-muted">
              Change these values and click Update Project — client portal will
              show the new progress.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  id="status"
                  name="status"
                  required
                  defaultValue={project?.status ?? "planning"}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Progress % *</Label>
                <Input
                  id="progress"
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  required
                  defaultValue={project?.progress ?? 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  id="priority"
                  name="priority"
                  required
                  defaultValue={project?.priority ?? "medium"}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={project?.description ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Assigned Team</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {employees.map((e) => (
                <label
                  key={e.id}
                  className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                >
                  <input
                    type="checkbox"
                    name="member_ids"
                    value={e.id}
                    defaultChecked={selectedMembers.includes(e.id)}
                  />
                  {e.full_name}
                </label>
              ))}
            </div>
          </div>
        </FormShell>
      </CardContent>
    </Card>
  );
}
