import { NextResponse } from "next/server";
import { SESSION_COOKIE, VENDOR_ID_COOKIE } from "@/lib/auth-constants";
import { acceptVendorInvite, getVendorByInviteToken } from "@/lib/goaccess-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const next = url.searchParams.get("next");
  const inviteToken = url.searchParams.get("invite");

  if (role !== "vendor" && role !== "partner") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let vendorId = "vendor-blue-haven";

  if (role === "partner" && inviteToken) {
    const vendor = await acceptVendorInvite(inviteToken);

    if (!vendor) {
      return NextResponse.redirect(new URL("/login?workspace=partner", request.url));
    }

    vendorId = vendor.id;
  } else if (role === "partner" && inviteToken === null) {
    const vendor = await getVendorByInviteToken("invite-blue-haven");
    vendorId = vendor?.id ?? vendorId;
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
  response.cookies.set(VENDOR_ID_COOKIE, vendorId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60 * 60 * 8,
  });

  return response;
}
