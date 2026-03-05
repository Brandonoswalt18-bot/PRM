import { NextResponse } from "next/server";
import { requireVendorRouteAccess } from "@/lib/auth-guards";
import { getVendorById, uploadSignedNdaForVendor } from "@/lib/goaccess-store";

export async function GET() {
  const auth = await requireVendorRouteAccess();

  if (auth.error) {
    return auth.error;
  }

  const session = auth.session;

  const vendor = await getVendorById(session.vendorId);

  if (!vendor) {
    return NextResponse.json({ message: "Approved vendor not found." }, { status: 404 });
  }

  return NextResponse.json({ vendor });
}

export async function POST(request: Request) {
  const auth = await requireVendorRouteAccess();

  if (auth.error) {
    return auth.error;
  }

  const session = auth.session;

  const formData = await request.formData();
  const ndaFile = formData.get("signedNda");

  if (!(ndaFile instanceof File)) {
    return NextResponse.json({ message: "Choose the signed NDA file to upload." }, { status: 400 });
  }

  try {
    const result = await uploadSignedNdaForVendor(session.vendorId, {
      fileName: ndaFile.name,
      contentType: ndaFile.type,
      size: ndaFile.size,
      bytes: new Uint8Array(await ndaFile.arrayBuffer()),
    });
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
