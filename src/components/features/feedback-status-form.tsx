"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  markFeedbackSeenAction,
  updateFeedbackStatusAction,
} from "@/actions/feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "planned", label: "Planned" },
  { value: "done", label: "Done" },
  { value: "dismissed", label: "Dismissed" },
];

export function FeedbackStatusForm({
  id,
  status,
  staffNotes,
  reply,
  isSeen,
}: {
  id: string;
  status: string;
  staffNotes: string | null;
  reply: string | null;
  isSeen: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 grid gap-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={isSeen ? "secondary" : "warning"}>
          {isSeen ? "Seen by team" : "Not seen yet"}
        </Badge>
        {!isSeen && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await markFeedbackSeenAction(id);
                if (result.success) {
                  toast.success("Marked as seen — client notified");
                  router.refresh();
                } else {
                  toast.error(result.error ?? "Failed");
                }
              });
            }}
          >
            Mark as seen
          </Button>
        )}
      </div>

      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            const result = await updateFeedbackStatusAction(null, formData);
            if (result.success) {
              toast.success("Saved — client can see reply & seen status");
              router.refresh();
            } else {
              toast.error(result.error ?? "Update failed");
            }
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`status-${id}`}>Status</Label>
            <Select
              id={`status-${id}`}
              name="status"
              defaultValue={status}
              disabled={pending}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`reply-${id}`}>Reply to client</Label>
            <Textarea
              id={`reply-${id}`}
              name="reply"
              rows={3}
              defaultValue={reply ?? ""}
              disabled={pending}
              placeholder="Client yeh comment dekh sake ga"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`notes-${id}`}>
              Internal notes (client nahi dekhega)
            </Label>
            <Textarea
              id={`notes-${id}`}
              name="staff_notes"
              rows={2}
              defaultValue={staffNotes ?? ""}
              disabled={pending}
              placeholder="Team-only note"
            />
          </div>
        </div>
        <div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving..." : "Save & notify client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
