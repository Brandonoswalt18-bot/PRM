import { NextResponse } from "next/server";
import { getWorkspaceSession } from "@/lib/auth";
import { getVendorById, updateVendorProfile } from "@/lib/goaccess-store";

type VendorProfilePayload = {
  companyName?: string;
  website?: string;
  city?: string;
  state?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
};

export async function GET() {
  const session = await getWorkspaceSession();

  if (!session?.vendorId) {
    return NextResponse.json({ message: "Approved vendor session required." }, { status: 401 });
  }

  const vendor = await getVendorById(session.vendorId);

  if (!vendor) {
    return NextResponse.json({ message: "Approved vendor not found." }, { status: 404 });
  }

  return NextResponse.json({ vendor });
}

export async function PATCH(request: Request) {
  const session = await getWorkspaceSession();

  if (!session?.vendorId) {
    return NextResponse.json({ message: "Approved vendor session required." }, { status: 401 });
  }

  let body: VendorProfilePayload;

  try {
    body = (await request.json()) as VendorProfilePayload;
  } catch {
    return NextResponse.json({ message: "Invalid profile payload." }, { status: 400 });
  }

  const companyName = body.companyName?.trim() ?? "";
  const website = body.website?.trim() ?? "";
  const city = body.city?.trim() ?? "";
  const state = body.state?.trim() ?? "";
  const primaryContactName = body.primaryContactName?.trim() ?? "";
  const primaryContactEmail = body.primaryContactEmail?.trim().toLowerCase() ?? "";

  if (!companyName || !city || !state || !primaryContactName || !primaryContactEmail) {
    return NextResponse.json(
      { message: "Business name, city, state, contact name, and email are required." },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryContactEmail)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const vendor = await updateVendorProfile(session.vendorId, {
      companyName,
      website,
      city,
      state,
      primaryContactName,
      primaryContactEmail,
    });

    return NextResponse.json({
      ok: true,
      vendor,
      message: "Vendor profile updated.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update vendor profile." },
      { status: 400 }
    );
  }
}
