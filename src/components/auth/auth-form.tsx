"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionResult } from "@/core/types/result";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full"
    >
      {pending ? "Please wait..." : label}
    </Button>
  );
}

export function AuthForm({
  action,
  title,
  subtitle,
  submitLabel,
  children,
  footer,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData
  ) => Promise<ActionResult>;
  title: string;
  subtitle: string;
  submitLabel: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <div className="w-full max-w-md animate-rise overflow-hidden rounded-3xl border border-white/20 bg-card/92 p-8 shadow-xl shadow-brand/10 dark:border-white/10 dark:bg-card/90">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          {APP_NAME}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
      <form action={formAction} className="space-y-4">
        {children}
        {state && !state.success && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {state.error}
          </p>
        )}
        <SubmitButton label={submitLabel} />
      </form>
      {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
    </div>
  );
}
