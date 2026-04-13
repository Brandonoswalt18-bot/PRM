import { NextResponse } from "next/server";
import { requireVendorRouteAccess } from "@/lib/auth-guards";
import {
  getDealById,
  recordDealSyncEvent,
  uploadSignedDealerAgreementForDeal,
} from "@/lib/goaccess-store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireVendorRouteAccess();

  if (auth.error) {
    return auth.error;
  }

  const session = auth.session;
  const { id } = await context.params;
  const deal = await getDealById(id);

  if (!deal || deal.vendorId !== session.vendorId) {
    return NextResponse.json({ message: "Deal not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const signedAgreementFile = formData.get("signedAgreement");

  if (!(signedAgreementFile instanceof File)) {
    return NextResponse.json({ message: "Choose the signed agreement file to upload." }, { status: 400 });
  }

  try {
    const result = await uploadSignedDealerAgreementForDeal(id, session.vendorId, {
      fileName: signedAgreementFile.name,
      contentType: signedAgreementFile.type,
      size: signedAgreementFile.size,
      bytes: new Uint8Array(await signedAgreementFile.arrayBuffer()),
    });
    const updatedDeal = await getDealById(id);

    await recordDealSyncEvent({
      dealId: id,
      vendorId: session.vendorId,
      action: "Signed dealer agreement uploaded",
      status: "synced",
      reference: result.fileName,
    });

    return NextResponse.json({
      ok: true,
      deal: updatedDeal,
      result,
      message: "Signed dealer agreement uploaded. GoAccess can now review the final copy.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to upload the signed dealer agreement.",
      },
      { status: 400 }
    );
  }
}
