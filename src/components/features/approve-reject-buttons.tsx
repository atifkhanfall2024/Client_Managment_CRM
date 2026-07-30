"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/core/types/result";

export function ApproveRejectButtons({
  userId,
  onApprove,
  onReject,
}: {
  userId: string;
  onApprove: (userId: string) => Promise<ActionResult>;
  onReject: (userId: string) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await onApprove(userId);
            if (r.success) {
              toast.success("User approved");
              router.refresh();
            } else toast.error(r.error ?? "Failed");
          })
        }
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await onReject(userId);
            if (r.success) {
              toast.success("User rejected");
              router.refresh();
            } else toast.error(r.error ?? "Failed");
          })
        }
      >
        Reject
      </Button>
    </div>
  );
}
