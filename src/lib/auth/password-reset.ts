import { hash, compare } from "bcryptjs";
import { randomInt, randomUUID } from "crypto";
import { connectMongo } from "@/lib/mongodb";
import { UserModel } from "@/lib/auth/user-model";
import { PasswordResetModel } from "@/lib/auth/password-reset-model";

function generateOtp() {
  return String(randomInt(100000, 1000000));
}

async function hashOtp(otp: string) {
  return hash(otp, 10);
}

/**
 * Always returns a generic message (no email enumeration).
 * Sends OTP only when an active account exists.
 */
export async function requestPasswordResetOtp(emailRaw: string) {
  await connectMongo();
  const email = emailRaw.toLowerCase().trim();
  const generic = {
    email,
    message:
      "If an account exists for this email, a verification code has been sent.",
  };

  const user = await UserModel.findOne({
    email,
    deleted_at: null,
  }).lean();

  if (!user) return generic;

  if (!user.is_active || user.approval_status === "rejected") {
    throw new Error("This account cannot reset its password. Contact support.");
  }

  const existing = await PasswordResetModel.findOne({ email }).lean();
  const lastSent = existing?.last_otp_sent_at
    ? new Date(existing.last_otp_sent_at as Date).getTime()
    : 0;
  if (lastSent && Date.now() - lastSent < 60_000) {
    throw new Error("Please wait 60 seconds before requesting another code.");
  }
  if (Number(existing?.resend_count ?? 0) >= 8) {
    throw new Error("Too many reset attempts. Try again later.");
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  await PasswordResetModel.findOneAndUpdate(
    { email },
    {
      $set: {
        otpHash,
        otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        otp_attempts: 0,
        verified_at: null,
        reset_expires_at: null,
        last_otp_sent_at: new Date(),
        resend_count: Number(existing?.resend_count ?? 0) + (existing ? 1 : 0),
      },
      $setOnInsert: {
        id: randomUUID(),
        email,
      },
    },
    { upsert: true, new: true }
  );

  const { sendPasswordResetOtpEmail } = await import("@/lib/mail");
  const mail = await sendPasswordResetOtpEmail({
    to: email,
    fullName: String(user.full_name),
    otp,
  });
  if (!mail.sent) {
    if (mail.reason === "not_configured") {
      throw new Error(
        "Email not configured. Add EMAIL and EMAIL_PASSWORD to .env.local."
      );
    }
    throw new Error("Could not send reset code. Please try again.");
  }

  return generic;
}

export async function verifyPasswordResetOtp(input: {
  email: string;
  otp: string;
}) {
  await connectMongo();
  const email = input.email.toLowerCase().trim();
  const otp = String(input.otp || "").trim();

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("Enter the 6-digit verification code");
  }

  const row = await PasswordResetModel.findOne({ email }).lean();
  if (!row) {
    throw new Error("No reset request found. Please start again.");
  }

  if (Number(row.otp_attempts ?? 0) >= 5) {
    await PasswordResetModel.deleteOne({ email });
    throw new Error("Too many invalid attempts. Request a new code.");
  }

  if (new Date(row.otp_expires_at as Date).getTime() < Date.now()) {
    throw new Error("Verification code expired. Request a new code.");
  }

  const valid = await compare(otp, String(row.otpHash));
  if (!valid) {
    await PasswordResetModel.updateOne(
      { email },
      { $inc: { otp_attempts: 1 } }
    );
    throw new Error("Invalid verification code");
  }

  await PasswordResetModel.updateOne(
    { email },
    {
      verified_at: new Date(),
      reset_expires_at: new Date(Date.now() + 15 * 60 * 1000),
    }
  );

  return { email, verified: true as const };
}

export async function completePasswordReset(input: {
  email: string;
  password: string;
}) {
  await connectMongo();
  const email = input.email.toLowerCase().trim();
  const password = input.password;

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const row = await PasswordResetModel.findOne({ email }).lean();
  if (!row?.verified_at) {
    throw new Error("Verify the email OTP before setting a new password.");
  }
  if (
    !row.reset_expires_at ||
    new Date(row.reset_expires_at as Date).getTime() < Date.now()
  ) {
    throw new Error(
      "Reset session expired. Start the forgot-password flow again."
    );
  }

  const user = await UserModel.findOne({ email, deleted_at: null }).lean();
  if (!user) {
    throw new Error("Account not found");
  }

  await UserModel.updateOne(
    { id: user.id },
    { passwordHash: await hash(password, 12) }
  );
  await PasswordResetModel.deleteOne({ email });

  return { email, reset: true as const };
}
