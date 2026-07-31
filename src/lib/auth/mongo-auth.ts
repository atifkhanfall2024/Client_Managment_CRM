import { hash, compare } from "bcryptjs";
import { randomInt, randomUUID } from "crypto";
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
import { isSuperAdminEmail } from "@/lib/constants";
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

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

async function hashOtp(otp: string) {
  return hash(otp, 10);
}

/**
 * Step 1: stash signup + email OTP. User document is NOT created yet.
 */
export async function startRegistrationWithOtp(input: {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
  reports_to?: string | null;
}) {
  await ensureSuperAdmin();
  await connectMongo();
  const { PendingRegistrationModel } = await import(
    "@/lib/auth/pending-registration-model"
  );

  const email = input.email.toLowerCase().trim();

  if (isSuperAdminEmail(email)) {
    throw new Error("This email is reserved for the Super Admin account");
  }

  const role = input.role ?? "employee";
  if (role === "super_admin" || role === "client") {
    throw new Error("You cannot register with this role");
  }
  if (!["admin", "manager", "employee"].includes(role)) {
    throw new Error("Invalid registration role");
  }

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const passwordHash = await hash(input.password, 12);
  const id = randomUUID();
  const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000);

  await PendingRegistrationModel.findOneAndUpdate(
    { email },
    {
      id,
      email,
      passwordHash,
      full_name: input.full_name,
      role,
      reports_to: input.reports_to ?? null,
      otpHash,
      otp_expires_at,
      otp_attempts: 0,
      resend_count: 0,
      last_otp_sent_at: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const { sendRegistrationOtpEmail } = await import("@/lib/mail");
  const mail = await sendRegistrationOtpEmail({
    to: email,
    fullName: input.full_name,
    otp,
  });
  if (!mail.sent) {
    if (mail.reason === "not_configured") {
      throw new Error(
        "Email not configured. Add EMAIL and EMAIL_PASSWORD (Gmail App Password) to .env.local then restart the server."
      );
    }
    throw new Error(
      "Could not send verification email. Check EMAIL / EMAIL_PASSWORD and restart npm run dev."
    );
  }

  return { email, expiresInMinutes: 10 };
}

/**
 * Step 2: verify OTP → create User in DB (pending admin approval) → session.
 */
export async function verifyRegistrationOtp(input: {
  email: string;
  otp: string;
}) {
  await ensureSuperAdmin();
  await connectMongo();
  const { PendingRegistrationModel } = await import(
    "@/lib/auth/pending-registration-model"
  );

  const email = input.email.toLowerCase().trim();
  const otp = String(input.otp || "").trim();

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("Enter the 6-digit verification code");
  }

  const pending = await PendingRegistrationModel.findOne({ email }).lean();
  if (!pending) {
    throw new Error("No pending verification found. Please register again.");
  }

  if (Number(pending.otp_attempts ?? 0) >= 5) {
    await PendingRegistrationModel.deleteOne({ email });
    throw new Error("Too many invalid attempts. Please register again.");
  }

  if (new Date(pending.otp_expires_at as Date).getTime() < Date.now()) {
    throw new Error("Verification code expired. Request a new code.");
  }

  const valid = await compare(otp, String(pending.otpHash));
  if (!valid) {
    await PendingRegistrationModel.updateOne(
      { email },
      { $inc: { otp_attempts: 1 } }
    );
    throw new Error("Invalid verification code");
  }

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    await PendingRegistrationModel.deleteOne({ email });
    throw new Error("An account with this email already exists");
  }

  const id = randomUUID();
  const role = pending.role as UserRole;

  await UserModel.create({
    id,
    email,
    passwordHash: pending.passwordHash,
    full_name: pending.full_name,
    role,
    is_active: true,
    approval_status: "pending",
    reports_to: pending.reports_to ?? null,
  });

  await PendingRegistrationModel.deleteOne({ email });

  try {
    const { notifyApproversOfRegistration } = await import(
      "@/actions/approvals"
    );
    await notifyApproversOfRegistration({
      full_name: String(pending.full_name),
      email,
      role,
      userId: id,
    });
  } catch {
    // continue
  }

  const token = await signSession({
    sub: id,
    email,
    full_name: String(pending.full_name),
    role,
  });
  await setSessionCookie(token);

  return { id, email, role, approval_status: "pending" as const };
}

export async function resendRegistrationOtp(emailRaw: string) {
  await connectMongo();
  const { PendingRegistrationModel } = await import(
    "@/lib/auth/pending-registration-model"
  );

  const email = emailRaw.toLowerCase().trim();
  const pending = await PendingRegistrationModel.findOne({ email }).lean();
  if (!pending) {
    throw new Error("No pending verification found. Please register again.");
  }

  const lastSent = pending.last_otp_sent_at
    ? new Date(pending.last_otp_sent_at as Date).getTime()
    : 0;
  if (Date.now() - lastSent < 60_000) {
    throw new Error("Please wait 60 seconds before requesting another code.");
  }
  if (Number(pending.resend_count ?? 0) >= 5) {
    throw new Error("Resend limit reached. Please register again later.");
  }

  const otp = generateOtp();
  await PendingRegistrationModel.updateOne(
    { email },
    {
      $set: {
        otpHash: await hashOtp(otp),
        otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        otp_attempts: 0,
        last_otp_sent_at: new Date(),
      },
      $inc: { resend_count: 1 },
    }
  );

  const { sendRegistrationOtpEmail } = await import("@/lib/mail");
  const mail = await sendRegistrationOtpEmail({
    to: email,
    fullName: String(pending.full_name),
    otp,
  });
  if (!mail.sent) {
    throw new Error("Could not send verification email. Try again shortly.");
  }

  return { email, expiresInMinutes: 10 };
}

/** @deprecated Prefer startRegistrationWithOtp + verifyRegistrationOtp */
export async function registerWithMongo(input: {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
  reports_to?: string | null;
}) {
  return startRegistrationWithOtp(input);
}

export async function loginWithMongo(input: {
  email: string;
  password: string;
}) {
  await ensureSuperAdmin();
  await connectMongo();

  const email = input.email.toLowerCase().trim();

  // Block login while email OTP is still pending (no User yet)
  const { PendingRegistrationModel } = await import(
    "@/lib/auth/pending-registration-model"
  );
  const pending = await PendingRegistrationModel.findOne({ email })
    .select("email")
    .lean();
  if (pending) {
    throw new Error(
      "Please verify your email with the OTP code before signing in."
    );
  }

  const user = await UserModel.findOne({
    email,
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
    role: user.role as UserRole,
    approval_status: (user.approval_status as ApprovalStatus) ?? "pending",
  };
}

export async function logoutMongo() {
  await clearSessionCookie();
}
