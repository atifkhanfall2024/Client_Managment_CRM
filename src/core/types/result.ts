/**
 * Typed application result — used by services, actions, and APIs.
 * Prefer this over throwing for expected business failures.
 */
export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: AppErrorCode,
    message: string,
    options?: { status?: number; details?: unknown; cause?: unknown }
  ) {
    super(message, { cause: options?.cause });
    this.name = "AppError";
    this.code = code;
    this.status = options?.status ?? statusFromCode(code);
    this.details = options?.details;
  }
}

function statusFromCode(code: AppErrorCode): number {
  switch (code) {
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "VALIDATION":
      return 400;
    case "CONFLICT":
      return 409;
    case "RATE_LIMITED":
      return 429;
    default:
      return 500;
  }
}

export type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: string; code?: AppErrorCode };

export function ok<T>(data?: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(
  error: string,
  code: AppErrorCode = "INTERNAL"
): ActionResult<never> {
  return { success: false, error, code };
}

export function fromAppError(error: unknown): ActionResult<never> {
  if (error instanceof AppError) {
    return fail(error.message, error.code);
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("credentials") || msg.includes("inactive")) {
      return fail(error.message, "UNAUTHORIZED");
    }
    if (msg.includes("already exists")) {
      return fail(error.message, "CONFLICT");
    }
    return fail(error.message, "INTERNAL");
  }
  return fail("Unexpected error", "INTERNAL");
}
