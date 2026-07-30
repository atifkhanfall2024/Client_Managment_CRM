import { redirect } from "next/navigation";
import {
  approveUserAction,
  getPendingUsers,
  rejectUserAction,
} from "@/actions/approvals";
import { requireProfile } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApproveRejectButtons } from "@/components/features/approve-reject-buttons";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Approvals" };
export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const profile = await requireProfile();
  if (!["super_admin", "admin", "manager"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const pending = await getPendingUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team approvals</h1>
        <p className="text-muted">
          {profile.role === "super_admin"
            ? `Approve Admins, Managers, and Employees before they can access ${APP_NAME}.`
            : profile.role === "admin"
              ? "Approve Managers and Employees under your control."
              : "Approve Employees reporting into your team."}
        </p>
        <p className="mt-1 text-xs text-muted">
          Signed in as {profile.full_name} ·{" "}
          <span className="capitalize">{profile.role.replace("_", " ")}</span>
        </p>
      </div>

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Pending requests{" "}
            <Badge variant="warning" className="ml-2">
              {pending.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && (
            <div className="space-y-2 py-8 text-center text-sm text-muted">
              <p className="font-medium text-foreground">No pending registrations</p>
              <p>
                Open an incognito window →{" "}
                <span className="font-medium text-brand">/register</span> → create
                an Admin / Manager / Employee account. Then refresh this page.
              </p>
              {profile.role === "super_admin" && (
                <p className="text-xs">
                  Super Admin approves everyone. New Admin signups are the most
                  important ones to approve first.
                </p>
              )}
            </div>
          )}
          {pending.map((user) => (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{user.full_name}</p>
                <p className="text-sm text-muted">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {user.role.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted">
                    Requested {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
              <ApproveRejectButtons
                userId={user.id}
                onApprove={approveUserAction}
                onReject={rejectUserAction}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
