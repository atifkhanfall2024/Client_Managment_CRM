import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffFeedback } from "@/actions/feedback";
import { requireProfile } from "@/lib/auth";
import { canViewClients } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { FeedbackStatusForm } from "@/components/features/feedback-status-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Client Feedback" };
export const dynamic = "force-dynamic";

export default async function StaffFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireProfile();
  if (!canViewClients(profile.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const items = await getStaffFeedback({
    status: params.status || undefined,
  });
  const openCount = items.filter((i) => i.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Client feedback & suggestions
        </h1>
        <p className="text-muted">
          Clients submit these from the portal. Review and update status here.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["", "All"],
          ["new", "New"],
          ["reviewed", "Reviewed"],
          ["planned", "Planned"],
          ["done", "Done"],
          ["dismissed", "Dismissed"],
        ].map(([value, label]) => (
          <Button
            key={label}
            asChild
            size="sm"
            variant={
              (params.status || "") === value ? "default" : "outline"
            }
          >
            <Link
              href={value ? `/feedback?status=${value}` : "/feedback"}
            >
              {label}
              {value === "new" && openCount > 0 ? ` (${openCount})` : ""}
            </Link>
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <Card className="border-border">
            <CardContent className="py-10 text-center text-sm text-muted">
              No feedback in this filter yet.
            </CardContent>
          </Card>
        )}
        {items.map((item) => (
          <Card key={item.id} className="border-border">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <p className="mt-1 text-xs text-muted">
                  {item.client_name} · {formatDateTime(item.created_at)} ·{" "}
                  {item.type === "feature" ? "Feature suggestion" : "Feedback"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={item.is_seen ? "secondary" : "warning"}>
                  {item.is_seen ? "Seen" : "Unseen"}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {item.type}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {item.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {item.message}
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-2 -ml-2">
                <Link href={`/clients/${item.client_id}`}>Open client</Link>
              </Button>
              <FeedbackStatusForm
                id={item.id}
                status={item.status}
                staffNotes={item.staff_notes}
                reply={item.reply}
                isSeen={item.is_seen}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
