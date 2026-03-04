import { NextResponse } from "next/server";
import { getWorkspaceSession } from "@/lib/auth";
import { getVendorById, uploadSignedNdaForVendor } from "@/lib/goaccess-store";

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

export async function POST(request: Request) {
  const session = await getWorkspaceSession();

  if (!session?.vendorId) {
    return NextResponse.json({ message: "Approved vendor session required." }, { status: 401 });
  }

  const formData = await request.formData();
  const ndaFile = formData.get("signedNda");

  if (!(ndaFile instanceof File)) {
    return NextResponse.json({ message: "Choose the signed NDA file to upload." }, { status: 400 });
  }

  try {
    const result = await uploadSignedNdaForVendor(session.vendorId, ndaFile);
    const vendor = await getVendorById(session.vendorId);

    return NextResponse.json({
      ok: true,
      vendor,
      result,
      message: "Signed NDA uploaded. GoAccess can review it before issuing credentials.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to upload signed NDA." },
      { status: 400 }
    );
  }
}
