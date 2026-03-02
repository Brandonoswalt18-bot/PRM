import { NextResponse } from "next/server";
import { SESSION_COOKIE, VENDOR_ID_COOKIE } from "@/lib/auth-constants";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 0,
  });
  response.cookies.set(VENDOR_ID_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 0,
  });
  return response;
}
