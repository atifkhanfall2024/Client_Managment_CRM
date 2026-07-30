import { getCurrentProfile } from "@/lib/auth";
import { AppError, fromAppError, type ActionResult } from "@/core/types/result";
import { enforceRateLimit } from "@/core/security/enforce-rate-limit";

/**
 * Wraps a service call for Server Actions:
 * - rate limit
 * - load actor
 * - map AppError → ActionResult
 */
export async function runAction<T>(
  key: string,
  fn: (ctx: {
    actor: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>;
  }) => Promise<T>,
  rate?: { limit: number; windowMs: number }
): Promise<ActionResult<T>> {
  try {
    const actor = await getCurrentProfile();
    if (!actor) {
      throw new AppError("UNAUTHORIZED", "Authentication required");
    }

    enforceRateLimit(`${key}:${actor.id}`, rate ?? { limit: 60, windowMs: 60_000 });
    const data = await fn({ actor });
    return { success: true, data };
  } catch (error) {
    return fromAppError(error);
  }
}
