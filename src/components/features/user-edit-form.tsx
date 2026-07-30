"use client";

import { FormShell } from "@/components/forms/form-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLES } from "@/lib/constants";
import type { ActionResult } from "@/core/types/result";
import type { Profile } from "@/types/database";

export function UserEditForm({
  users,
  action,
}: {
  users: Profile[];
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
}) {
  return (
    <FormShell action={action} submitLabel="Update user" className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="user_id">Select user</Label>
        <Select id="user_id" name="user_id" required defaultValue="">
          <option value="" disabled>
            Choose user
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name} ({u.email})
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select id="role" name="role" defaultValue="employee">
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="is_active">Active</Label>
        <Select id="is_active" name="is_active" defaultValue="true">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>
    </FormShell>
  );
}
