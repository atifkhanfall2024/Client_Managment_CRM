import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { ThemeToggle } from "@/components/shared/theme-toggle";
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
    <main className="mesh-bg relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute left-10 top-16 h-56 w-56 rounded-full bg-brand/15 blur-3xl animate-float" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-64 w-64 rounded-full bg-foreground/10 blur-3xl animate-float" />
      <div className="relative w-full max-w-md space-y-4">
        {errorHint && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
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
              <Link href="/register" className="font-semibold text-brand hover:underline">
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
      </div>
    </main>
  );
}
