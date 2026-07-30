import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LandingPage } from "@/components/marketing/landing-page";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(
      profile.approval_status === "approved" ? "/dashboard" : "/pending"
    );
  }

  return <LandingPage />;
}
