import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const role = request.cookies.get(SESSION_COOKIE)?.value;

  if (pathname.startsWith("/app") && role !== "vendor") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/portal") && role !== "partner") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/portal/:path*"],
};
