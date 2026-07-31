import Link from "next/link";
import { redirect } from "next/navigation";
import { forgotPasswordResetAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Set new password" };

export default async function ForgotPasswordResetPage({
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
        action={forgotPasswordResetAction}
        title="Set new password"
        subtitle="Choose a strong password for your account (min 8 characters)."
        submitLabel="Update password"
        footer={
          <p className="text-muted">
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Back to sign in
            </Link>
          </p>
        }
      >
        <input type="hidden" name="email" value={email} />
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input
            id="confirm_password"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            className="h-11"
          />
        </div>
      </AuthForm>
    </AuthShell>
  );
}
