import { NextResponse } from "next/server";
import { SESSION_COOKIE, VENDOR_ID_COOKIE } from "@/lib/auth-constants";
import { createSignedSession } from "@/lib/auth-session";
import { setVendorPasswordFromInvite } from "@/lib/goaccess-store";

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

function buildInviteRedirect(request: Request, token: string, error: string) {
  const url = new URL(`/invite/${token}`, resolveRequestOrigin(request));
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
    return NextResponse.redirect(new URL("/login", resolveRequestOrigin(request)), 303);
  }

  if (password.length < 10) {
    return NextResponse.redirect(buildInviteRedirect(request, token, "password-too-short"), 303);
  }

  if (password !== confirmPassword) {
    return NextResponse.redirect(buildInviteRedirect(request, token, "password-mismatch"), 303);
  }

  try {
    const vendor = await setVendorPasswordFromInvite(token, password);
    let sessionToken: string;

    try {
      sessionToken = await createSignedSession({
        role: "vendor",
        email: vendor.primaryContactEmail.trim().toLowerCase(),
        vendorId: vendor.id,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "AUTH_SECRET must be configured for production auth."
      ) {
        return NextResponse.redirect(buildInviteRedirect(request, token, "auth-not-configured"), 303);
      }

      throw error;
    }

    const response = NextResponse.redirect(
      new URL(next.startsWith("/portal") ? next : "/portal/profile", resolveRequestOrigin(request)),
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
