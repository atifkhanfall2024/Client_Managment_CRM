import { Schema, models, model } from "mongoose";
import type { ApprovalStatus, UserRole } from "@/types/database";

const userSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    full_name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "employee"],
      default: "employee",
    },
    phone: { type: String, default: null },
    avatar_url: { type: String, default: null },
    is_active: { type: Boolean, default: true },
    approval_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approved_by: { type: String, default: null },
    /** Manager reports to Admin; Employee reports to Manager (or Admin). */
    reports_to: { type: String, default: null, index: true },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export type AppUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  approval_status: ApprovalStatus;
  approved_by?: string | null;
  reports_to?: string | null;
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  passwordHash?: string;
};

export const UserModel = models.User || model("User", userSchema, "users");
