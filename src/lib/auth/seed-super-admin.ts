import { hash } from "bcryptjs";
import { connectMongo } from "@/lib/mongodb";
import { UserModel } from "@/lib/auth/user-model";
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_NAME,
  SUPER_ADMIN_PASSWORD,
} from "@/lib/constants";

let seeded = false;

/** Ensures the fixed Super Admin account exists and stays approved. */
export async function ensureSuperAdmin() {
  if (seeded) return;
  await connectMongo();

  const email = SUPER_ADMIN_EMAIL.toLowerCase();
  const existing = await UserModel.findOne({ email })
    .select("+passwordHash")
    .lean();

  const passwordHash = await hash(SUPER_ADMIN_PASSWORD, 12);

  if (!existing) {
    await UserModel.create({
      id: crypto.randomUUID(),
      email,
      passwordHash,
      full_name: SUPER_ADMIN_NAME,
      role: "super_admin",
      is_active: true,
      approval_status: "approved",
    });
  } else {
    await UserModel.updateOne(
      { email },
      {
        role: "super_admin",
        approval_status: "approved",
        is_active: true,
        deleted_at: null,
        passwordHash,
        full_name: SUPER_ADMIN_NAME,
      }
    );
  }

  seeded = true;
}
