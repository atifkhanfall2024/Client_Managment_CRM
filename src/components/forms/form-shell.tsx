"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { ActionResult } from "@/core/types/result";
import { Button } from "@/components/ui/button";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  );
}

export function FormShell({
  action,
  children,
  submitLabel = "Save",
  onSuccess,
  className,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel?: string;
  onSuccess?: () => void;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (!state) return;
    if (state.success) {
      toast.success("Saved successfully");
      onSuccess?.();
    } else {
      toast.error(state.error ?? "Save failed");
    }
    // Only react to new action results, not onSuccess identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className={className ?? "space-y-4"}>
      {children}
      <div className="flex justify-end gap-2 pt-2">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
