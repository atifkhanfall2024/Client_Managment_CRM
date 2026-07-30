import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/auth");

  const isPendingRoute = path.startsWith("/pending");

  const protectedPrefixes = [
    "/dashboard",
    "/clients",
    "/companies",
    "/projects",
    "/tasks",
    "/users",
    "/approvals",
    "/reports",
    "/documents",
    "/notifications",
    "/activity",
    "/settings",
    "/api/clients",
    "/api/files",
  ];

  const isProtected = protectedPrefixes.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

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

  // Logged-in users on auth pages go to dashboard;
  // requireProfile will bounce pending users to /pending.
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
