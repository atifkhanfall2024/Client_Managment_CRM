import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/** Staff CRM surfaces (clients must not access these). */
const STAFF_PREFIXES = [
  "/dashboard",
  "/clients",
  "/companies",
  "/projects",
  "/meetings",
  "/tasks",
  "/users",
  "/approvals",
  "/reports",
  "/documents",
  "/notifications",
  "/activity",
  "/settings",
  "/api/clients",
];

/** Unauthenticated guests may visit only these. */
const PUBLIC_EXACT = new Set(["/"]);
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
];

function isPublicPath(path: string) {
  if (PUBLIC_EXACT.has(path)) return true;
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function isStaffPath(path: string) {
  return STAFF_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  const isPendingRoute = path.startsWith("/pending");
  const isPortalRoute = path.startsWith("/portal");
  const isApiRoute = path.startsWith("/api/");
  const isStaffProtected = isStaffPath(path);
  const isPublic = isPublicPath(path);

  /** Deny by default: every non-public route requires a valid session. */
  const needsAuth = !isPublic;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let user: Awaited<ReturnType<typeof verifySessionToken>> = null;

  if (token) {
    try {
      user = await verifySessionToken(token);
    } catch {
      user = null;
    }
  }

  if (!user && needsAuth) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Authed users should not use guest auth pages
  if (
    user &&
    (path.startsWith("/login") ||
      path.startsWith("/register") ||
      path.startsWith("/forgot-password") ||
      path.startsWith("/verify-email"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = user.role === "client" ? "/portal" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Client ↔ staff isolation
  if (user?.role === "client" && (isStaffProtected || isPendingRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  if (user && user.role !== "client" && isPortalRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
