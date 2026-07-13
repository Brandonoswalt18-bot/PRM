import { NextResponse } from "next/server";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import { getVendorById } from "@/lib/goaccess-store";
import type { WorkspaceSession } from "@/types/prm";

type VendorWorkspaceSession = WorkspaceSession & { vendorId: string };

export async function requireAdminRouteAccess() {
  const [role, session] = await Promise.all([getWorkspaceRole(), getWorkspaceSession()]);

  if (role !== "admin" || !session) {
    return NextResponse.json({ message: "Admin session required." }, { status: 401 });
  }

  return null;
}

export async function requireVendorRouteAccess() {
  const [role, session] = await Promise.all([getWorkspaceRole(), getWorkspaceSession()]);

  if (role !== "vendor" || !session?.vendorId) {
    return {
      error: NextResponse.json({ message: "Approved vendor session required." }, { status: 401 }),
      session: null,
    };
  }

  return {
    error: null,
    session: session as VendorWorkspaceSession,
  };
}

export async function requireVendorLegalRouteAccess() {
  const auth = await requireVendorRouteAccess();

  if (auth.error || !auth.session) {
    return auth;
  }

  const vendor = await getVendorById(auth.session.vendorId);

  if (!vendor) {
    return {
      error: NextResponse.json({ message: "Approved vendor not found." }, { status: 404 }),
      session: null,
    };
  }

  if (vendor.ndaStatus !== "signed" || !vendor.termsAcceptedAt) {
    return {
      error: NextResponse.json(
        {
          message:
            "Accept the NDA and Partner Agreement before using the vendor portal.",
          code: "LEGAL_ONBOARDING_REQUIRED",
        },
        { status: 403 }
      ),
      session: null,
    };
  }

  return auth;
}
