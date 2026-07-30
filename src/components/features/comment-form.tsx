"use client";

import { FormShell } from "@/components/forms/form-shell";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/core/types/result";

export function CommentForm({
  action,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
}) {
  return (
    <FormShell action={action} submitLabel="Add comment">
      <div className="space-y-2">
        <Label htmlFor="content">Add a comment</Label>
        <Textarea id="content" name="content" required rows={3} />
      </div>
    </FormShell>
  );
}
