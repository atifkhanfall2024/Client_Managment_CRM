import Link from "next/link";
import { redirect } from "next/navigation";
import { forgotPasswordVerifyAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Verify reset code" };

export default async function ForgotPasswordVerifyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const email = String(params.email || "")
    .toLowerCase()
    .trim();
  if (!email.includes("@")) redirect("/forgot-password");

  return (
    <AuthShell>
      <AuthForm
        action={forgotPasswordVerifyAction}
        title="Verify code"
        subtitle={`Enter the 6-digit code sent to ${email}`}
        submitLabel="Verify code"
        footer={
          <p className="text-muted">
            <Link
              href="/forgot-password"
              className="font-semibold text-brand hover:underline"
            >
              Resend / change email
            </Link>
          </p>
        }
      >
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
            className="h-12 tracking-[0.35em] text-center text-lg font-semibold"
            placeholder="6-digit code"
            autoComplete="one-time-code"
          />
        </div>
      </AuthForm>
    </AuthShell>
  );
}
