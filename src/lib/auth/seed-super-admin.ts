import { hash } from "bcryptjs";
import { connectMongo } from "@/lib/mongodb";
import { UserModel } from "@/lib/auth/user-model";
import {
  SUPER_ADMIN_ACCOUNTS,
  SUPER_ADMIN_PASSWORD,
} from "@/lib/constants";

let seeded = false;

/** Ensures fixed Super Admin accounts exist and stay approved. */
export async function ensureSuperAdmin() {
  if (seeded) return;
  await connectMongo();

  const passwordHash = await hash(SUPER_ADMIN_PASSWORD, 12);

  for (const account of SUPER_ADMIN_ACCOUNTS) {
    const email = account.email.toLowerCase();
    const existing = await UserModel.findOne({ email })
      .select("+passwordHash")
      .lean();

    if (!existing) {
      await UserModel.create({
        id: crypto.randomUUID(),
        email,
        passwordHash,
        full_name: account.full_name,
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
          full_name: account.full_name,
        }
      );
    }
  }

  seeded = true;
}
