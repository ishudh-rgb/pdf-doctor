import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isLocalDevAuthEnabled } from "@/lib/auth/auth-config";
import { getLocalDevUserIdFromRequestEdge } from "@/lib/auth/local-dev-session-edge";

const PROTECTED_ROUTES = ["/dashboard", "/admin"];
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@only4pdf.com";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabaseResponse, user: supabaseUser } = await updateSession(request);
  const localDevUserId = isLocalDevAuthEnabled()
    ? await getLocalDevUserIdFromRequestEdge(request)
    : null;
  const isAuthenticated = !!supabaseUser || !!localDevUserId;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith("/admin");

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && supabaseUser?.email && supabaseUser.email !== ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
