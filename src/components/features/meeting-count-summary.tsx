import type { MeetingCountRow } from "@/lib/meetings/stats";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CountList({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: MeetingCountRow[];
  emptyLabel: string;
}) {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">{emptyLabel}</p>
        )}
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{row.name}</p>
              <p className="text-xs text-muted">
                {row.upcoming} upcoming · {row.past} past
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {row.total} meeting{row.total === 1 ? "" : "s"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MeetingCountSummary({
  byManager,
  byClient,
  showClients = true,
  managerTitle = "Meetings by project manager",
  clientTitle = "Meetings by client",
}: {
  byManager: MeetingCountRow[];
  byClient?: MeetingCountRow[];
  showClients?: boolean;
  managerTitle?: string;
  clientTitle?: string;
}) {
  return (
    <div
      className={`grid gap-6 ${showClients ? "lg:grid-cols-2" : ""}`}
    >
      <CountList
        title={managerTitle}
        rows={byManager}
        emptyLabel="No meetings with managers yet."
      />
      {showClients && (
        <CountList
          title={clientTitle}
          rows={byClient ?? []}
          emptyLabel="No client meetings yet."
        />
      )}
    </div>
  );
}
