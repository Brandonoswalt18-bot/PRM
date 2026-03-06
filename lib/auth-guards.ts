import { NextResponse } from "next/server";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
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
