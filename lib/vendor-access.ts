import { redirect } from "next/navigation";
import { getWorkspaceSession } from "@/lib/auth";
import { getVendorById } from "@/lib/goaccess-store";

export async function requireVendorLegalPageAccess() {
  const session = await getWorkspaceSession();

  if (!session?.vendorId) {
    redirect("/login?next=%2Fportal");
  }

  const vendor = await getVendorById(session.vendorId);

  if (!vendor || vendor.ndaStatus !== "signed" || !vendor.termsAcceptedAt) {
    redirect("/portal/onboarding?required=legal");
  }

  return vendor;
}
