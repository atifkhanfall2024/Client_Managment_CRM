"use client";

import { useActionState } from "react";
import { enableClientPortalAction } from "@/actions/portal";
import type { ActionResult } from "@/core/types/result";
import type { ApprovalStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ClientPortalAccessForm({
  clientId,
  defaultEmail,
  defaultName,
  hasPortal,
  portalApprovalStatus,
  portalEmail,
}: {
  clientId: string;
  defaultEmail?: string | null;
  defaultName?: string | null;
  hasPortal: boolean;
  portalApprovalStatus?: ApprovalStatus | null;
  portalEmail?: string | null;
}) {
  const bound = enableClientPortalAction.bind(null, clientId);
  const [state, formAction] = useActionState(
    bound as (
      prev: ActionResult | null,
      formData: FormData
    ) => Promise<ActionResult>,
    null
  );

  const successData = state?.success
    ? (state.data as { pending?: boolean; message?: string } | undefined)
    : undefined;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-base">
          {hasPortal ? "Client portal access" : "Enable client portal"}
        </CardTitle>
        {hasPortal && portalApprovalStatus && (
          <Badge
            variant={
              portalApprovalStatus === "approved"
                ? "success"
                : portalApprovalStatus === "rejected"
                  ? "danger"
                  : "warning"
            }
            className="capitalize"
          >
            {portalApprovalStatus}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted">
          Create a login for this client. They must be{" "}
          <span className="font-medium text-foreground">approved by Admin</span>{" "}
          before they can open their private dashboard (projects, progress,
          tasks, files).
        </p>
        {hasPortal && portalEmail && (
          <p className="mb-4 rounded-lg border border-border bg-brand-soft/30 px-3 py-2 text-sm">
            Linked portal: <span className="font-medium">{portalEmail}</span>
            {portalApprovalStatus === "pending" &&
              " — waiting in Approvals for Admin verification."}
            {portalApprovalStatus === "approved" &&
              " — client can sign in at /login → Client Portal."}
          </p>
        )}
        <form action={formAction} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="portal_name">Portal name</Label>
            <Input
              id="portal_name"
              name="portal_name"
              defaultValue={defaultName ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portal_email">Portal email</Label>
            <Input
              id="portal_email"
              name="portal_email"
              type="email"
              defaultValue={defaultEmail ?? portalEmail ?? ""}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="portal_password">Portal password</Label>
            <Input
              id="portal_password"
              name="portal_password"
              type="password"
              minLength={8}
              required
              placeholder="Min 8 characters"
            />
          </div>
          {state && !state.success && (
            <p className="sm:col-span-2 text-sm text-red-600">{state.error}</p>
          )}
          {state?.success && (
            <p className="sm:col-span-2 rounded-lg bg-brand-soft/50 px-3 py-2 text-sm text-foreground">
              {successData?.message ??
                (successData?.pending
                  ? "Portal login created — approve it under Approvals."
                  : "Portal login updated.")}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit">
              {hasPortal ? "Update portal login" : "Create portal login"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
