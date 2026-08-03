"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { UserModel } from "@/lib/auth/user-model";
import { createNotification } from "@/lib/activity";
import { hasPermission } from "@/lib/rbac";
import {
  canApproveTarget,
  homeLinkForApprovedRole,
  pendingRolesForActor,
} from "@/lib/security/approvals-policy";
import type { ActionResult } from "@/core/types/result";
import type { UserRole } from "@/types/database";
import { CACHE_TTL, CRM_TAGS, cachedQuery, bustUsers, bustPortal } from "@/lib/cache";

export async function getPendingUsers() {
  const profile = await requireProfile();

  return cachedQuery(
    ["pending-users", profile.id, profile.role],
    [CRM_TAGS.approvals, CRM_TAGS.users],
    async () => {
      await connectMongo();

      await UserModel.updateMany(
        {
          role: { $ne: "super_admin" },
          $or: [
            { approval_status: { $exists: false } },
            { approval_status: null },
          ],
        },
        { $set: { approval_status: "pending" } }
      );

      const roles = pendingRolesForActor(profile.role);
      if (!roles?.length) return [];

      const rows = await UserModel.find({
        approval_status: "pending",
        role: { $in: roles },
        $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
      })
        .sort({ created_at: -1 })
        .lean();

      return rows.map((u) => ({
        id: String(u.id),
        email: String(u.email),
        full_name: String(u.full_name),
        role: u.role as UserRole,
        created_at: u.created_at
          ? new Date(u.created_at as Date).toISOString()
          : new Date().toISOString(),
      }));
    },
    CACHE_TTL.list
  );
}

export async function approveUserAction(userId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  await connectMongo();

  const target = await UserModel.findOne({
    id: userId,
    $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
  }).lean();
  if (!target) return { success: false, error: "User not found" };

  if (!canApproveTarget(profile.role, target.role as UserRole)) {
    return { success: false, error: "You cannot approve this role" };
  }

  await UserModel.updateOne(
    { id: userId },
    {
      approval_status: "approved",
      approved_by: profile.id,
      reports_to: target.reports_to || profile.id,
      is_active: true,
    }
  );

  const link = homeLinkForApprovedRole(target.role as UserRole);
  await createNotification({
    user_id: userId,
    title: "Account approved",
    message:
      target.role === "client"
        ? "Your client portal access was approved. You can track your projects now."
        : `Your ${String(target.role).replace("_", " ")} account was approved. You can access the dashboard now.`,
    link,
  });

  // Best-effort email — approval must succeed even if SMTP fails
  try {
    const { sendAccountApprovedEmail } = await import("@/lib/mail");
    await sendAccountApprovedEmail({
      to: String(target.email),
      fullName: String(target.full_name),
      role: target.role as UserRole,
    });
  } catch (error) {
    console.error("[approvals] approval email failed:", error);
  }

  bustUsers();
  bustPortal();
  revalidatePath("/pending");
  return { success: true };
}

export async function rejectUserAction(userId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!hasPermission(profile.role, "users.manage") && profile.role !== "manager") {
    return { success: false, error: "Permission denied" };
  }

  await connectMongo();
  const target = await UserModel.findOne({ id: userId }).lean();
  if (!target) return { success: false, error: "User not found" };
  if (!canApproveTarget(profile.role, target.role as UserRole)) {
    return { success: false, error: "You cannot reject this role" };
  }

  await UserModel.updateOne(
    { id: userId },
    { approval_status: "rejected", approved_by: profile.id, is_active: false }
  );

  await createNotification({
    user_id: userId,
    title: "Account rejected",
    message: "Your registration was rejected. Contact your administrator.",
  });

  try {
    const { sendAccountRejectedEmail } = await import("@/lib/mail");
    await sendAccountRejectedEmail({
      to: String(target.email),
      fullName: String(target.full_name),
      role: target.role as UserRole,
    });
  } catch (error) {
    console.error("[approvals] rejection email failed:", error);
  }

  bustUsers();
  return { success: true };
}

/** Notify the people who can approve this registration. */
export async function notifyApproversOfRegistration(params: {
  full_name: string;
  email: string;
  role: UserRole;
  userId: string;
}) {
  await connectMongo();

  const approverFilter: Record<string, unknown> = {
    $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
    is_active: true,
    approval_status: "approved",
  };

  if (params.role === "admin") {
    approverFilter.role = "super_admin";
  } else if (params.role === "manager") {
    approverFilter.role = { $in: ["super_admin", "admin"] };
  } else if (params.role === "client") {
    approverFilter.role = { $in: ["super_admin", "admin"] };
  } else {
    approverFilter.role = { $in: ["super_admin", "admin", "manager"] };
  }

  const label =
    params.role === "client" ? "client portal" : params.role.replace("_", " ");

  const approvers = await UserModel.find(approverFilter).select("id").lean();
  await Promise.all(
    approvers.map((a) =>
      createNotification({
        user_id: String(a.id),
        title: "New approval request",
        message: `${params.full_name} (${params.email}) needs approval as ${label}.`,
        type: "approval",
        link: "/approvals",
      })
    )
  );
}
