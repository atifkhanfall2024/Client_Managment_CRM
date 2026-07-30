import { redirect } from "next/navigation";
import { getActivityLogs } from "@/actions/dashboard";
import { requireProfile } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Activity Logs" };

export default async function ActivityPage() {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "activity.view")) {
    redirect("/dashboard");
  }

  const logs = await getActivityLogs(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <p className="text-slate-500">Audit trail of important CRM actions</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-2 rounded-lg border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800"
            >
              <div>
                <p className="text-sm">
                  <span className="font-medium">
                    {(log.actor as { full_name?: string } | null)?.full_name ??
                      "System"}
                  </span>{" "}
                  <span className="text-slate-500">
                    {log.action} {log.entity_type}
                  </span>
                </p>
                <p className="text-xs text-slate-400">
                  {formatDate(log.created_at)}
                </p>
              </div>
              <Badge variant="outline" className="w-fit capitalize">
                {log.entity_type}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
