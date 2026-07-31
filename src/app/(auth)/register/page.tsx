import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { APP_NAME, REGISTER_ROLES } from "@/lib/constants";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthForm
        action={registerAction}
        title="Join the workspace"
        subtitle={`${APP_NAME} accounts require approval before dashboard access`}
        submitLabel="Create account"
        footer={
          <p className="text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand hover:underline"
            >
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
          <Input
            id="email"
            name="email"
            type="email"
            required
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
    </AuthShell>
  );
}
