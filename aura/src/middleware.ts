import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  const protectedPaths = ["/explore", "/create", "/gallery", "/collections", "/settings"];
  const adminPaths = ["/admin"];
  const authPaths = ["/login", "/register"];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));
  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/explore", req.url));
  }

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
  }

  if (isAdmin) {
    const role = (req.auth?.user as { role?: string })?.role;
    if (!isLoggedIn || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/explore", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|fonts).*)",
  ],
};
