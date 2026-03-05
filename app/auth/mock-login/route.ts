import { NextResponse } from "next/server";
import { SESSION_COOKIE, VENDOR_ID_COOKIE } from "@/lib/auth-constants";
import { resolveWorkspaceDestination } from "@/lib/auth";
import { acceptVendorInvite, getVendorById } from "@/lib/goaccess-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const account = url.searchParams.get("account");
  const email = url.searchParams.get("email")?.trim().toLowerCase();
  const next = url.searchParams.get("next");
  const inviteToken = url.searchParams.get("invite");

  let role: "admin" | "vendor" | null = null;
  let vendorId = "vendor-blue-haven";

  if (inviteToken) {
    const vendor = await acceptVendorInvite(inviteToken);

    if (!vendor) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    role = "vendor";
    vendorId = vendor.id;
  } else if (email === "maya@goaccess.com") {
    role = "admin";
  } else if (account === "admin") {
    role = "admin";
  } else if (email) {
    const { listApprovedVendors } = await import("@/lib/goaccess-store");
    const vendor = (await listApprovedVendors()).find(
      (item) =>
        item.credentialsIssued &&
        item.portalAccess === "active" &&
        item.primaryContactEmail.trim().toLowerCase() === email
    );

    if (vendor) {
      role = "vendor";
      vendorId = vendor.id;
    }
  } else if (account) {
    const vendor = await getVendorById(account);

    if (vendor?.credentialsIssued) {
      role = "vendor";
      vendorId = vendor.id;
    }
  }

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "not-found");
    if (next?.startsWith("/")) {
      loginUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(loginUrl);
  }

  const destination = resolveWorkspaceDestination(role, next);

  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60 * 60 * 8,
  });
  response.cookies.set(VENDOR_ID_COOKIE, vendorId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60 * 60 * 8,
  });

  return response;
}
