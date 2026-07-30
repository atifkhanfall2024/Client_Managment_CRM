import { AppError } from "@/core/types/result";
import { rateLimit } from "@/core/security/rate-limit";

export function enforceRateLimit(
  key: string,
  options: { limit: number; windowMs: number } = {
    limit: 60,
    windowMs: 60_000,
  }
) {
  const result = rateLimit(key, options);
  if (!result.allowed) {
    throw new AppError(
      "RATE_LIMITED",
      "Too many requests. Please try again later.",
      { details: { resetAt: result.resetAt } }
    );
  }
  return result;
}
