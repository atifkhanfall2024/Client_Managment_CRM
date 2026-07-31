import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { homePathForRole } from "@/lib/rbac";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(
      profile.approval_status === "approved"
        ? homePathForRole(profile.role)
        : "/pending"
    );
  }

  return <LandingPage />;
}
