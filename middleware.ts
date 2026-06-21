import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import authConfig from "./auth.config";
import ROUTES from "@/constants/routes";

const { auth } = NextAuth(authConfig);

export async function middleware(req: NextRequest) {
  const session = await auth();
  const url = req.nextUrl;
  const pathname = url.pathname;

  // 🔒 First: If no session and user tries to access a protected route
  const isProtectedRoute = pathname.startsWith("/dashboard");

  if (!session?.user && isProtectedRoute) {
    const redirectUrl = new URL(ROUTES.SIGN_IN, req.url);
    redirectUrl.searchParams.set("error", "unauthenticated");
    redirectUrl.searchParams.set("next", pathname); // Preserve path for redirect
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
