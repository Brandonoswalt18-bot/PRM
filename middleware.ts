import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

function normalizeWorkspaceRole(rawRole: string | null | undefined) {
  if (!rawRole) {
    return null;
  }

  if (rawRole === "admin" || rawRole === "vendor") {
    return rawRole;
  }

  if (rawRole === "partner") {
    return "vendor";
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const role = normalizeWorkspaceRole(request.cookies.get(SESSION_COOKIE)?.value);

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
