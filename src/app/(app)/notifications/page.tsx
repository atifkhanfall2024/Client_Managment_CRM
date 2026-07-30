import {
  getNotifications,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/dashboard";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MarkReadButton } from "@/components/features/mark-read-button";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-slate-500">Stay updated on assignments and changes</p>
        </div>
        <form action={markAllNotificationsReadAction}>
          <Button type="submit" variant="outline">
            Mark all read
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 && (
            <p className="text-sm text-slate-500">No notifications yet.</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${
                n.read_at
                  ? "border-slate-100 dark:border-slate-800"
                  : "border-border bg-brand-soft/60"
              }`}
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  {!n.read_at && <Badge>New</Badge>}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {n.message}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(n.created_at)}
                </p>
                {n.link && (
                  <Link
                    href={n.link}
                    className="mt-2 inline-block text-sm text-brand hover:underline"
                  >
                    Open
                  </Link>
                )}
              </div>
              {!n.read_at && (
                <MarkReadButton
                  action={markNotificationReadAction.bind(null, n.id)}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
