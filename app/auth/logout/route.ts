import { NextResponse } from "next/server";
import { SESSION_COOKIE, VENDOR_ID_COOKIE } from "@/lib/auth-constants";

function getCookieSecureFlag() {
  return process.env.NODE_ENV === "production";
}

function resolveRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    return origin;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    (host?.startsWith("127.0.0.1") || host?.startsWith("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", resolveRequestOrigin(request)), 307);
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: getCookieSecureFlag(),
    maxAge: 0,
  });
  response.cookies.set(VENDOR_ID_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: getCookieSecureFlag(),
    maxAge: 0,
  });
  return response;
}
