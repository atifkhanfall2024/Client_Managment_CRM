import { Schema, models, model } from "mongoose";

/** Temporary password-reset challenge — OTP then password change. */
const passwordResetSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: { type: String, required: true },
    otp_expires_at: { type: Date, required: true, index: true },
    otp_attempts: { type: Number, default: 0 },
    verified_at: { type: Date, default: null },
    reset_expires_at: { type: Date, default: null },
    last_otp_sent_at: { type: Date, default: null },
    resend_count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const PasswordResetModel =
  models.PasswordReset ||
  model("PasswordReset", passwordResetSchema, "password_resets");
