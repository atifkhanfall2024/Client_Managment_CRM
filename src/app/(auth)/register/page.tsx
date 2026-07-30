import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { APP_NAME, REGISTER_ROLES } from "@/lib/constants";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <main className="mesh-bg relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="pointer-events-none absolute left-8 top-20 h-56 w-56 rounded-full bg-brand/15 blur-3xl animate-float" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-64 w-64 rounded-full bg-foreground/10 blur-3xl animate-float" />
      <AuthForm
        action={registerAction}
        title="Join the workspace"
        subtitle={`${APP_NAME} accounts require approval before dashboard access`}
        submitLabel="Create account"
        footer={
          <p className="text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </p>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue="employee" className="h-11">
            {REGISTER_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.hint}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted">
            Super Admin is reserved. Admins need Super Admin approval. Managers
            and Employees stay under Admin control.
          </p>
        </div>
      </AuthForm>
    </main>
  );
}
