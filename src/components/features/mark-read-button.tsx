"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/core/types/result";

export function MarkReadButton({
  action,
}: {
  action: () => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          void action();
        });
      }}
    >
      Mark read
    </Button>
  );
}
