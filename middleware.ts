import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { readSignedSession } from "@/lib/auth-session";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await readSignedSession(request.cookies.get(SESSION_COOKIE)?.value);
  const role = session?.role ?? null;

  if (pathname.startsWith("/app") && role !== "admin") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/portal") && role !== "vendor") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/portal/:path*"],
};
