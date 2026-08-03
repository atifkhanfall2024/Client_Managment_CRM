import { hash } from "bcryptjs";
import { connectMongo } from "@/lib/mongodb";
import { UserModel } from "@/lib/auth/user-model";
import {
  SUPER_ADMIN_ACCOUNTS,
  SUPER_ADMIN_PASSWORD,
} from "@/lib/constants";

let seeded = false;
let seeding: Promise<void> | null = null;

/** Ensures fixed Super Admin accounts exist. Does not re-hash on every request. */
export async function ensureSuperAdmin() {
  if (seeded) return;
  if (seeding) return seeding;

  seeding = (async () => {
    await connectMongo();

    for (const account of SUPER_ADMIN_ACCOUNTS) {
      const email = account.email.toLowerCase();
      const existing = await UserModel.findOne({ email })
        .select("id role is_active approval_status deleted_at")
        .lean();

      if (!existing) {
        const passwordHash = await hash(SUPER_ADMIN_PASSWORD, 10);
        await UserModel.create({
          id: crypto.randomUUID(),
          email,
          passwordHash,
          full_name: account.full_name,
          role: "super_admin",
          is_active: true,
          approval_status: "approved",
        });
        continue;
      }

      if (
        existing.role !== "super_admin" ||
        !existing.is_active ||
        existing.approval_status !== "approved" ||
        existing.deleted_at
      ) {
        await UserModel.updateOne(
          { email },
          {
            role: "super_admin",
            approval_status: "approved",
            is_active: true,
            deleted_at: null,
            full_name: account.full_name,
          }
        );
      }
    }

    seeded = true;
  })().finally(() => {
    seeding = null;
  });

  return seeding;
}
