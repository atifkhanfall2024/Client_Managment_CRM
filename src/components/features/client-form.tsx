"use client";

import { useRouter } from "next/navigation";
import { FormShell } from "@/components/forms/form-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CLIENT_STATUSES, PRIORITIES } from "@/lib/constants";
import type { ActionResult } from "@/core/types/result";
import type { Client } from "@/types/database";

export function ClientForm({
  action,
  companies,
  managers,
  client,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  companies: { id: string; name: string }[];
  managers: { id: string; full_name: string }[];
  client?: {
    id?: string;
    name?: string;
    company_id?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    address?: string | null;
    industry?: string | null;
    budget?: number | null;
    deadline?: string | null;
    requirements?: string | null;
    status?: Client["status"];
    priority?: Client["priority"];
    assigned_manager_id?: string | null;
  };
}) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="pt-6">
        <FormShell
          action={action}
          submitLabel={client ? "Update Client" : "Create Client"}
          onSuccess={() => router.push("/clients")}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required defaultValue={client?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_id">Company</Label>
            <Select
              id="company_id"
              name="company_id"
              defaultValue={client?.company_id ?? ""}
            >
              <option value="">None</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigned_manager_id">Assigned Manager</Label>
            <Select
              id="assigned_manager_id"
              name="assigned_manager_id"
              defaultValue={client?.assigned_manager_id ?? ""}
            >
              <option value="">Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={client?.email ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              placeholder="example.com"
              defaultValue={client?.website ?? ""}
            />
            <p className="text-xs text-muted">
              Optional — e.g. example.com (https is added automatically)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              name="industry"
              defaultValue={client?.industry ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={client?.address ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              min={0}
              defaultValue={client?.budget ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              name="deadline"
              type="date"
              defaultValue={client?.deadline ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              name="status"
              defaultValue={client?.status ?? "lead"}
            >
              {CLIENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              id="priority"
              name="priority"
              defaultValue={client?.priority ?? "medium"}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              name="requirements"
              rows={4}
              defaultValue={client?.requirements ?? ""}
            />
          </div>
        </FormShell>
      </CardContent>
    </Card>
  );
}
