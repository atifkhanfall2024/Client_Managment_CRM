import type { UserRole } from "@/types/database";

/** Who may approve/reject a pending registration. */
export function canApproveTarget(actorRole: UserRole, targetRole: UserRole) {
  if (targetRole === "super_admin") return false;
  if (actorRole === "super_admin") {
    return (
      targetRole === "admin" ||
      targetRole === "manager" ||
      targetRole === "employee" ||
      targetRole === "client"
    );
  }
  if (actorRole === "admin") {
    return (
      targetRole === "manager" ||
      targetRole === "employee" ||
      targetRole === "client"
    );
  }
  if (actorRole === "manager") {
    return targetRole === "employee";
  }
  return false;
}

/** Roles an actor can see in the pending approvals queue. */
export function pendingRolesForActor(actorRole: UserRole): UserRole[] | null {
  if (actorRole === "super_admin") {
    return ["admin", "manager", "employee", "client"];
  }
  if (actorRole === "admin") {
    return ["manager", "employee", "client"];
  }
  if (actorRole === "manager") {
    return ["employee"];
  }
  return null;
}

export function homeLinkForApprovedRole(role: UserRole) {
  return role === "client" ? "/portal" : "/dashboard";
}
