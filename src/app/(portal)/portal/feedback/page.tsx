import { getPortalFeedback } from "@/actions/feedback";
import { PortalFeedbackForm } from "@/components/features/portal-feedback-form";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Feedback" };
export const dynamic = "force-dynamic";

export default async function PortalFeedbackPage() {
  const items = await getPortalFeedback();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Feedback & suggestions
        </h1>
        <p className="text-muted">
          Share feedback or request features. You can see if the team has seen
          it and any reply they send.
        </p>
      </div>

      <PortalFeedbackForm />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Your submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              No submissions yet.
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(item.created_at)} ·{" "}
                    {item.type === "feature" ? "Feature" : "Feedback"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={item.is_seen ? "secondary" : "warning"}
                  >
                    {item.is_seen
                      ? `Seen${item.seen_at ? ` · ${formatDateTime(item.seen_at)}` : ""}`
                      : "Not seen yet"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {item.status}
                  </Badge>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                {item.message}
              </p>
              {item.reply && (
                <div className="mt-3 rounded-lg border border-brand/30 bg-brand-soft/30 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                    Team reply
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {item.reply}
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
