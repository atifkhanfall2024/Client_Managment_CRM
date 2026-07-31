import { Schema, models, model } from "mongoose";

/**
 * Temporary signup stash — User is created ONLY after OTP verification.
 */
const pendingRegistrationSchema = new Schema(
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
    passwordHash: { type: String, required: true },
    full_name: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      required: true,
    },
    reports_to: { type: String, default: null },
    otpHash: { type: String, required: true },
    otp_expires_at: { type: Date, required: true, index: true },
    otp_attempts: { type: Number, default: 0 },
    resend_count: { type: Number, default: 0 },
    last_otp_sent_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const PendingRegistrationModel =
  models.PendingRegistration ||
  model(
    "PendingRegistration",
    pendingRegistrationSchema,
    "pending_registrations"
  );
