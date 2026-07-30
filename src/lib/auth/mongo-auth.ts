import { hash, compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { connectMongo } from "@/lib/mongodb";
import { UserModel } from "@/lib/auth/user-model";
import { ensureSuperAdmin } from "@/lib/auth/seed-super-admin";
import {
  clearSessionCookie,
  getSession,
  setSessionCookie,
  signSession,
} from "@/lib/auth/session";
import { SUPER_ADMIN_EMAIL } from "@/lib/constants";
import type { ApprovalStatus, Profile, UserRole } from "@/types/database";

function toProfile(user: {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  approval_status?: ApprovalStatus;
  approved_by?: string | null;
  reports_to?: string | null;
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}): Profile {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    phone: user.phone ?? null,
    avatar_url: user.avatar_url ?? null,
    is_active: user.is_active,
    approval_status: user.approval_status ?? "pending",
    approved_by: user.approved_by ?? null,
    reports_to: user.reports_to ?? null,
    deleted_at: user.deleted_at ? user.deleted_at.toISOString() : null,
    created_at: (user.created_at ?? new Date()).toISOString(),
    updated_at: (user.updated_at ?? new Date()).toISOString(),
  };
}

export async function getSessionUser() {
  return getSession();
}

export async function getCurrentProfile(): Promise<Profile | null> {
  await ensureSuperAdmin();
  const session = await getSession();
  if (!session) return null;

  await connectMongo();
  const user = await UserModel.findOne({
    id: session.sub,
    deleted_at: null,
  }).lean();

  if (!user || !user.is_active) return null;

  return toProfile({
    id: String(user.id),
    email: user.email,
    full_name: user.full_name,
    role: user.role as UserRole,
    phone: user.phone,
    avatar_url: user.avatar_url,
    is_active: user.is_active,
    approval_status: (user.approval_status as ApprovalStatus) ?? "pending",
    approved_by: user.approved_by,
    reports_to: user.reports_to,
    deleted_at: user.deleted_at,
    created_at: user.created_at as Date | undefined,
    updated_at: user.updated_at as Date | undefined,
  });
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?error=inactive");
  if (profile.approval_status === "rejected") {
    redirect("/login?error=rejected");
  }
  if (profile.approval_status !== "approved") {
    redirect("/pending");
  }
  return profile;
}

export async function requireAnySessionProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function registerWithMongo(input: {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
  reports_to?: string | null;
}) {
  await ensureSuperAdmin();
  await connectMongo();

  const email = input.email.toLowerCase().trim();

  if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error("This email is reserved for the Super Admin account");
  }

  const role = input.role ?? "employee";
  if (role === "super_admin") {
    throw new Error("You cannot register as Super Admin");
  }

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const id = crypto.randomUUID();
  const passwordHash = await hash(input.password, 12);

  await UserModel.create({
    id,
    email,
    passwordHash,
    full_name: input.full_name,
    role,
    is_active: true,
    approval_status: "pending",
    reports_to: input.reports_to ?? null,
  });

  try {
    const { notifyApproversOfRegistration } = await import(
      "@/actions/approvals"
    );
    await notifyApproversOfRegistration({
      full_name: input.full_name,
      email,
      role,
      userId: id,
    });
  } catch {
    // Registration should still succeed if notification fails
  }

  const token = await signSession({
    sub: id,
    email,
    full_name: input.full_name,
    role,
  });
  await setSessionCookie(token);

  return { id, email, role, approval_status: "pending" as const };
}

export async function loginWithMongo(input: {
  email: string;
  password: string;
}) {
  await ensureSuperAdmin();
  await connectMongo();

  const user = await UserModel.findOne({
    email: input.email.toLowerCase().trim(),
    deleted_at: null,
  })
    .select("+passwordHash")
    .lean();

  if (!user?.passwordHash) {
    throw new Error("Invalid login credentials");
  }

  const valid = await compare(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid login credentials");
  }

  if (!user.is_active) {
    throw new Error("Account is inactive");
  }

  if (user.approval_status === "rejected") {
    throw new Error("Your account was rejected. Contact Super Admin.");
  }

  const token = await signSession({
    sub: String(user.id),
    email: user.email,
    full_name: user.full_name,
    role: user.role as UserRole,
  });
  await setSessionCookie(token);

  return {
    id: String(user.id),
    email: user.email,
    approval_status: (user.approval_status as ApprovalStatus) ?? "pending",
  };
}

export async function logoutMongo() {
  await clearSessionCookie();
}
