import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const next = url.searchParams.get("next");

  if (role !== "vendor" && role !== "partner") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const destination =
    next && next.startsWith("/") ? next : role === "vendor" ? "/app" : "/portal";

  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60 * 60 * 8,
  });

  return response;
}
