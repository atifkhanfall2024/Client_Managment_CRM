import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

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

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/auth");

  const isPendingRoute = path.startsWith("/pending");
  const isPortalRoute = path.startsWith("/portal");

  const isStaffProtected = STAFF_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );
  const isProtected =
    isStaffProtected || isPortalRoute || path.startsWith("/api/files");

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let user: Awaited<ReturnType<typeof verifySessionToken>> = null;

  if (token) {
    try {
      user = await verifySessionToken(token);
    } catch {
      user = null;
    }
  }

  if (!user && (isProtected || isPendingRoute)) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = user.role === "client" ? "/portal" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Client users stay in portal only
  if (user?.role === "client" && isStaffProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  // Staff cannot use portal routes
  if (user && user.role !== "client" && isPortalRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
