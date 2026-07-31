"use client";

import { useActionState } from "react";
import {
  resendEmailOtpAction,
  verifyEmailOtpAction,
} from "@/actions/auth";
import type { ActionResult } from "@/core/types/result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";

export function VerifyEmailForm({ email }: { email: string }) {
  const [verifyState, verifyAction] = useActionState(
    verifyEmailOtpAction,
    null as ActionResult | null
  );
  const [resendState, resendAction] = useActionState(
    resendEmailOtpAction,
    null as ActionResult | null
  );

  return (
    <div className="w-full max-w-md animate-rise overflow-hidden rounded-3xl border border-white/20 bg-card/85 p-8 shadow-2xl shadow-brand/10 backdrop-blur-2xl dark:border-white/10 dark:bg-card/80">
      <div className="mb-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
          {APP_NAME}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Verify your email
        </h1>
        <p className="text-sm text-muted">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>. Your
          account is created in the database only after this code is verified.
        </p>
      </div>

      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        <div className="space-y-2">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            name="otp"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="6-digit code"
            className="h-12 tracking-[0.35em] text-center text-lg font-semibold"
            autoComplete="one-time-code"
          />
        </div>
        {verifyState && !verifyState.success && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {verifyState.error}
          </p>
        )}
        <Button type="submit" className="h-11 w-full">
          Verify & continue
        </Button>
      </form>

      <form action={resendAction} className="mt-4">
        <input type="hidden" name="email" value={email} />
        {resendState?.success && (
          <p className="mb-2 rounded-lg bg-brand-soft/40 px-3 py-2 text-sm">
            {(resendState.data as { message?: string } | undefined)?.message ??
              "Code resent."}
          </p>
        )}
        {resendState && !resendState.success && (
          <p className="mb-2 text-sm text-red-600">{resendState.error}</p>
        )}
        <Button type="submit" variant="outline" className="h-11 w-full">
          Resend code
        </Button>
      </form>
    </div>
  );
}
