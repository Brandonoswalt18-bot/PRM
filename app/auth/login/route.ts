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

function buildLoginRedirect(request: Request, error: string, next?: string | null) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", error);

  if (next?.startsWith("/")) {
    url.searchParams.set("next", next);
  }

  return url;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(buildLoginRedirect(request, "missing-credentials", next));
  }

  let role: "admin" | "vendor" | null = null;
  let vendorId: string | undefined;
  const adminPassword = getAdminPassword();

  if (adminPassword && email === getAdminEmail() && password === adminPassword) {
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

  const sessionToken = await createSignedSession({
    role,
    email,
    vendorId,
  });
  const response = NextResponse.redirect(
    new URL(resolveWorkspaceDestination(role, next), request.url),
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
