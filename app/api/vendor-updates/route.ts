import { NextResponse } from "next/server";
import { requireVendorLegalRouteAccess } from "@/lib/auth-guards";
import { listPublishedPartnerUpdates } from "@/lib/goaccess-store";

export async function GET() {
  const auth = await requireVendorLegalRouteAccess();

  if (auth.error) {
    return auth.error;
  }

  const updates = await listPublishedPartnerUpdates();
  return NextResponse.json({ updates });
}
