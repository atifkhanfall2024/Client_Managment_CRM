"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { loginSchema, registerSchema } from "@/lib/validations";
import { enforceRateLimit } from "@/core/security/enforce-rate-limit";
import type { ActionResult } from "@/core/types/result";
import { fromAppError } from "@/core/types/result";
import {
  loginWithMongo,
  logoutMongo,
  registerWithMongo,
} from "@/lib/auth";
import type { UserRole } from "@/types/database";

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    enforceRateLimit(`auth:login:${String(formData.get("email") || "anon")}`, {
      limit: 20,
      windowMs: 60_000,
    });

    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
        code: "VALIDATION",
      };
    }

    const result = await loginWithMongo(parsed.data);
    if (result.approval_status !== "approved") {
      redirect("/pending");
    }
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return fromAppError(error);
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    enforceRateLimit(`auth:register:${String(formData.get("email") || "anon")}`, {
      limit: 10,
      windowMs: 60_000,
    });

    const role = (formData.get("role") || "employee") as UserRole;
    if (role === "super_admin") {
      return {
        success: false,
        error: "Super Admin cannot be self-registered",
        code: "FORBIDDEN",
      };
    }

    const parsed = registerSchema.safeParse({
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role,
    });

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
        code: "VALIDATION",
      };
    }

    await registerWithMongo({
      email: parsed.data.email,
      password: parsed.data.password,
      full_name: parsed.data.full_name,
      role: parsed.data.role as UserRole,
      reports_to: (formData.get("reports_to") as string) || null,
    });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return fromAppError(error);
  }

  redirect("/pending");
}

export async function logoutAction() {
  await logoutMongo();
  revalidatePath("/", "layout");
  redirect("/");
}
