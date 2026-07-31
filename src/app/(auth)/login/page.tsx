import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Sign in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  return <LoginInner searchParams={searchParams} />;
}

async function LoginInner({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const errorHint =
    params.error === "rejected"
      ? "Your account was rejected. Contact Super Admin."
      : params.error === "inactive"
        ? "Your account is inactive."
        : null;

  return (
    <AuthShell>
      {errorHint && (
        <p className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 backdrop-blur dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
          {errorHint}
        </p>
      )}
      <AuthForm
        action={loginAction}
        title="Welcome back"
        subtitle={`Sign in to your ${APP_NAME} workspace`}
        submitLabel="Sign in"
        footer={
          <p className="text-muted">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand hover:underline"
            >
              Create an account
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
            placeholder="you@company.com"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="h-11"
          />
        </div>
      </AuthForm>
    </AuthShell>
  );
}
