import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isLocalDevAuthEnabled } from "@/lib/auth/auth-config";
import { getLocalDevUserIdFromRequestEdge } from "@/lib/auth/local-dev-session-edge";
import { GUEST_SESSION_COOKIE } from "@/lib/privacy/guest-session";

const PROTECTED_ROUTES = ["/dashboard", "/admin"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  const { supabaseResponse, user: supabaseUser, profileRole } =
    await updateSession(request, { loadProfileRole: isAdminRoute });

  const localDevUserId = isLocalDevAuthEnabled()
    ? await getLocalDevUserIdFromRequestEdge(request)
    : null;
  const isAuthenticated = !!supabaseUser || !!localDevUserId;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && isAuthenticated) {
    const isAdmin =
      profileRole === "admin" ||
      (isLocalDevAuthEnabled() && !!localDevUserId);
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  supabaseResponse.headers.set("x-pathname", pathname);

  if (!request.cookies.get(GUEST_SESSION_COOKIE)?.value) {
    supabaseResponse.cookies.set(GUEST_SESSION_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
