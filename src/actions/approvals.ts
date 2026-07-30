"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { UserModel } from "@/lib/auth/user-model";
import { createNotification } from "@/lib/activity";
import { hasPermission } from "@/lib/rbac";
import type { ActionResult } from "@/core/types/result";
import type { UserRole } from "@/types/database";

function canApproveTarget(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === "super_admin") return targetRole !== "super_admin";
  if (actorRole === "admin") {
    return targetRole === "manager" || targetRole === "employee";
  }
  if (actorRole === "manager") {
    return targetRole === "employee";
  }
  return false;
}

export async function getPendingUsers() {
  const profile = await requireProfile();
  await connectMongo();

  // Older accounts may lack approval_status — treat as pending
  await UserModel.updateMany(
    {
      role: { $ne: "super_admin" },
      $or: [{ approval_status: { $exists: false } }, { approval_status: null }],
    },
    { $set: { approval_status: "pending" } }
  );

  const filter: Record<string, unknown> = {
    approval_status: "pending",
    $or: [{ deleted_at: null }, { deleted_at: { $exists: false } }],
  };

  if (profile.role === "super_admin") {
    filter.role = { $in: ["admin", "manager", "employee"] };
  } else if (profile.role === "admin") {
    filter.role = { $in: ["manager", "employee"] };
  } else if (profile.role === "manager") {
    filter.role = "employee";
  } else {
    return [];
  }

  const rows = await UserModel.find(filter).sort({ created_at: -1 }).lean();

  return rows.map((u) => ({
    id: String(u.id),
    email: String(u.email),
    full_name: String(u.full_name),
    role: u.role as UserRole,
    created_at: u.created_at
      ? new Date(u.created_at as Date).toISOString()
      : new Date().toISOString(),
  }));
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

  await createNotification({
    user_id: userId,
    title: "Account approved",
    message: `Your ${String(target.role).replace("_", " ")} account was approved. You can access the dashboard now.`,
    link: "/dashboard",
  });

  revalidatePath("/approvals");
  revalidatePath("/users");
  revalidatePath("/dashboard");
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

  revalidatePath("/approvals");
  revalidatePath("/users");
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
  } else {
    approverFilter.role = { $in: ["super_admin", "admin", "manager"] };
  }

  const approvers = await UserModel.find(approverFilter).select("id").lean();
  await Promise.all(
    approvers.map((a) =>
      createNotification({
        user_id: String(a.id),
        title: "New approval request",
        message: `${params.full_name} (${params.email}) registered as ${params.role.replace("_", " ")}.`,
        type: "approval",
        link: "/approvals",
      })
    )
  );
}
