import { NextResponse } from "next/server";
import { SESSION_COOKIE, VENDOR_ID_COOKIE } from "@/lib/auth-constants";
import { createSignedSession } from "@/lib/auth-session";
import { setVendorPasswordFromInvite } from "@/lib/goaccess-store";

function getCookieSecureFlag() {
  return process.env.NODE_ENV === "production";
}

function buildInviteRedirect(request: Request, token: string, error: string) {
  const url = new URL(`/invite/${token}`, request.url);
  url.searchParams.set("error", error);
  return url;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const next = String(formData.get("next") ?? "/portal/profile");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  if (password.length < 10) {
    return NextResponse.redirect(buildInviteRedirect(request, token, "password-too-short"), 303);
  }

  if (password !== confirmPassword) {
    return NextResponse.redirect(buildInviteRedirect(request, token, "password-mismatch"), 303);
  }

  try {
    const vendor = await setVendorPasswordFromInvite(token, password);
    const sessionToken = await createSignedSession({
      role: "vendor",
      email: vendor.primaryContactEmail.trim().toLowerCase(),
      vendorId: vendor.id,
    });
    const response = NextResponse.redirect(
      new URL(next.startsWith("/portal") ? next : "/portal/profile", request.url),
      303
    );

    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: getCookieSecureFlag(),
      maxAge: 60 * 60 * 8,
    });
    response.cookies.set(VENDOR_ID_COOKIE, vendor.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: getCookieSecureFlag(),
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.redirect(buildInviteRedirect(request, token, "activation-failed"), 303);
  }
}
