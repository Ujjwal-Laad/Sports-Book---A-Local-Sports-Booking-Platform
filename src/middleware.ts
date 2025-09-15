import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@/generated/prisma";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const pathname = req.nextUrl.pathname;

  // Redirect logged-in users away from auth pages
  if (
    token &&
    (pathname.startsWith("/auth/login") ||
      pathname.startsWith("/auth/register"))
  ) {
    const url =
      token.role === Role.ADMIN
        ? "/admin/dashboard"
        : token.role === Role.OWNER
        ? "/owner/dashboard"
        : "/dashboard";
    return NextResponse.redirect(new URL(url, req.url));
  }

  // Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!token || token.role !== Role.ADMIN) {
      return NextResponse.redirect(
        new URL("/auth/login?callbackUrl=" + pathname, req.url)
      );
    }
  }

  // Protect /owner routes
  if (pathname.startsWith("/owner")) {
    if (!token || token.role !== Role.OWNER) {
      return NextResponse.redirect(
        new URL("/auth/login?callbackUrl=" + pathname, req.url)
      );
    }
  }

  // Protect general user-only routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/my-bookings")
  ) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/auth/login?callbackUrl=" + pathname, req.url)
      );
    }
  }

  return NextResponse.next();
}

// ✅ FIX: Add the matcher config to ensure middleware runs only on pages
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * This prevents middleware from running on static assets.
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
