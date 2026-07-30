import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, type AppErrorCode } from "@/core/types/result";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    code: AppErrorCode;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function apiOk<T>(
  data: T,
  init?: { status?: number; meta?: Record<string, unknown> }
) {
  const body: ApiSuccess<T> = {
    success: true,
    data,
    ...(init?.meta ? { meta: init.meta } : {}),
  };
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function apiFail(
  code: AppErrorCode,
  message: string,
  options?: { status?: number; details?: unknown }
) {
  const status =
    options?.status ??
    ({
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      VALIDATION: 400,
      CONFLICT: 409,
      RATE_LIMITED: 429,
      INTERNAL: 500,
    }[code] as number);

  const body: ApiFailure = {
    success: false,
    error: {
      code,
      message,
      ...(options?.details !== undefined ? { details: options.details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return apiFail(error.code, error.message, {
      status: error.status,
      details: error.details,
    });
  }

  if (error instanceof ZodError) {
    return apiFail("VALIDATION", "Validation failed", {
      status: 400,
      details: error.flatten(),
    });
  }

  console.error("[api]", error);
  return apiFail("INTERNAL", "Internal server error");
}
