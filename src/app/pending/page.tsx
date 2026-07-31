import { logoutAction } from "@/actions/auth";
import { requireAnySessionProfile } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Clock3, ShieldCheck } from "lucide-react";
import { homePathForRole } from "@/lib/rbac";

export const metadata = { title: "Pending Approval" };

export default async function PendingPage() {
  const profile = await requireAnySessionProfile();

  if (profile.approval_status === "approved") {
    redirect(homePathForRole(profile.role));
  }

  if (profile.approval_status === "rejected") {
    redirect("/login?error=rejected");
  }

  const isClient = profile.role === "client";
  const who = isClient
    ? "an Admin or Super Admin"
    : profile.role === "admin"
      ? "Super Admin"
      : profile.role === "manager"
        ? "an Admin"
        : "an Admin or Manager";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#1a2332] px-4 text-[#e6ebf2]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(44,82,130,0.35),_transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(11,16,24,0.9),_transparent_50%)]" />
      <Card className="relative w-full max-w-lg border-white/10 bg-white/5 text-[#e6ebf2] shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2c5282]/30 text-[#d4deea]">
            <Clock3 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Approval required</CardTitle>
          <p className="text-sm text-slate-300">
            Welcome to <span className="font-semibold text-white">{APP_NAME}</span>,{" "}
            {profile.full_name}. Your{" "}
            <span className="capitalize">
              {isClient ? "client portal" : profile.role.replace("_", " ")}
            </span>{" "}
            account is waiting for verification.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
            <div className="mb-2 flex items-center gap-2 font-medium text-[#7c9bc2]">
              <ShieldCheck className="h-4 w-4" /> Access policy
            </div>
            <p>
              {isClient
                ? `You cannot open your client dashboard until ${who} approves this portal login. After approval you will only see your own projects and files.`
                : `You cannot open the dashboard until ${who} approves your account. Managers and employees stay under Admin control after approval.`}
            </p>
          </div>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="outline"
              className="w-full border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
