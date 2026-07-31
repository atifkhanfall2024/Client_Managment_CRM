import Link from "next/link";
import { forgotPasswordRequestAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <AuthForm
        action={forgotPasswordRequestAction}
        title="Forgot password"
        subtitle="Enter your account email. We will send a 6-digit verification code."
        submitLabel="Send verification code"
        footer={
          <p className="text-muted">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="h-11"
            placeholder="you@company.com"
          />
        </div>
      </AuthForm>
    </AuthShell>
  );
}
