import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@/types/database";

export const SESSION_COOKIE = "crm_session";

export type SessionPayload = {
  sub: string;
  email: string;
  full_name: string;
  role: UserRole;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    // Dev fallback — set AUTH_SECRET in production
    return new TextEncoder().encode(
      "dev-only-clientcrm-auth-secret-change-me"
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({
    email: payload.email,
    full_name: payload.full_name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  if (!payload.sub || typeof payload.email !== "string") {
    return null;
  }

  return {
    sub: payload.sub,
    email: payload.email,
    full_name: String(payload.full_name ?? ""),
    role: payload.role as UserRole,
  } satisfies SessionPayload;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Deduped per RSC request — layout + pages share one JWT verify. */
export const getSession = cache(
  async (): Promise<SessionPayload | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    try {
      return await verifySessionToken(token);
    } catch {
      return null;
    }
  }
);
