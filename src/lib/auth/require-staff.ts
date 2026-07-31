import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/mongo-auth";
import { isStaffRole } from "@/lib/rbac";
import type { Profile } from "@/types/database";

/** Staff-only pages/actions. Clients are sent to their portal. */
export async function requireStaffProfile(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isStaffRole(profile.role)) {
    redirect("/portal");
  }
  return profile;
}
