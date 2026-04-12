import { NextResponse } from "next/server";
import { SESSION_COOKIE, VENDOR_ID_COOKIE } from "@/lib/auth-constants";
import { createSignedSession } from "@/lib/auth-session";
import { resolveWorkspaceDestination } from "@/lib/auth";
import { verifyVendorPassword } from "@/lib/goaccess-store";

function getAdminEmail() {
  return (process.env.GOACCESS_ADMIN_EMAIL?.trim().toLowerCase() || "maya@goaccess.com");
}

function getAdminPassword() {
  const configuredPassword = process.env.GOACCESS_ADMIN_PASSWORD?.trim();

  if (configuredPassword) {
    return configuredPassword;
  }

  if (process.env.NODE_ENV !== "production") {
    return "goaccess-admin-demo";
  }

  return null;
}

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

function buildLoginRedirect(request: Request, error: string, next?: string | null) {
  const params = new URLSearchParams({ error });

  if (next?.startsWith("/")) {
    params.set("next", next);
  }

  return new URL(`/login?${params.toString()}`, resolveRequestOrigin(request));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(buildLoginRedirect(request, "missing-credentials", next), 303);
  }

  let role: "admin" | "vendor" | null = null;
  let vendorId: string | undefined;
  const adminPassword = getAdminPassword();
  const adminEmail = getAdminEmail();

  if (!adminPassword && email === adminEmail) {
    return NextResponse.redirect(buildLoginRedirect(request, "admin-not-configured", next), 303);
  }

  if (adminPassword && email === adminEmail && password === adminPassword) {
    role = "admin";
  } else {
    const vendor = await verifyVendorPassword(email, password);

    if (vendor) {
      role = "vendor";
      vendorId = vendor.id;
    }
  }

  if (!role) {
    return NextResponse.redirect(buildLoginRedirect(request, "invalid-credentials", next), 303);
  }

  let sessionToken: string;

  try {
    sessionToken = await createSignedSession({
      role,
      email,
      vendorId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "AUTH_SECRET must be configured for production auth."
    ) {
      return NextResponse.redirect(buildLoginRedirect(request, "auth-not-configured", next), 303);
    }

    throw error;
  }

  const response = NextResponse.redirect(
    new URL(resolveWorkspaceDestination(role, next), resolveRequestOrigin(request)),
    303
  );

  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: getCookieSecureFlag(),
    maxAge: 60 * 60 * 8,
  });
  response.cookies.set(VENDOR_ID_COOKIE, vendorId ?? "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: getCookieSecureFlag(),
    maxAge: role === "vendor" ? 60 * 60 * 8 : 0,
  });

  return response;
}
