import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import {
  getDealById,
  markDealerAgreementSent,
  recordDealSyncEvent,
  uploadDealerAgreementForDeal,
} from "@/lib/goaccess-store";
import type { VendorPayoutType } from "@/types/goaccess";

function parseNonNegativeNumber(value: FormDataEntryValue | null, fieldLabel: string) {
  const raw = value?.toString().trim() ?? "";

  if (!raw) {
    throw new Error(`${fieldLabel} is required.`);
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldLabel} must be zero or greater.`);
  }

  return parsed;
}

function parsePayoutType(value: FormDataEntryValue | null): VendorPayoutType | undefined {
  const raw = value?.toString().trim() ?? "";

  if (!raw) {
    return undefined;
  }

  if (raw !== "percentage_rmr" && raw !== "flat_monthly") {
    throw new Error("Unsupported vendor payout type.");
  }

  return raw;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminRouteAccess();

  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const deal = await getDealById(id);

  if (!deal) {
    return NextResponse.json({ message: "Deal not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const agreementFile = formData.get("agreementFile");

  if (!(agreementFile instanceof File)) {
    return NextResponse.json({ message: "Choose the dealer agreement file to upload." }, { status: 400 });
  }

  try {
    const expectedMonthlyRmr = parseNonNegativeNumber(formData.get("expectedMonthlyRmr"), "Expected monthly RMR");
    const vendorPayoutRate = parseNonNegativeNumber(formData.get("vendorPayoutRate"), "Vendor payout rate");
    const vendorPayoutType = parsePayoutType(formData.get("vendorPayoutType"));
    const result = await uploadDealerAgreementForDeal(
      id,
      {
        fileName: agreementFile.name,
        contentType: agreementFile.type,
        size: agreementFile.size,
        bytes: new Uint8Array(await agreementFile.arrayBuffer()),
      },
      {
        expectedMonthlyRmr,
        vendorPayoutType,
        vendorPayoutRate,
      }
    );
    const sendResult = await markDealerAgreementSent(id, { notifyVendor: true });
    const updatedDeal = await getDealById(id);

    await recordDealSyncEvent({
      dealId: id,
      vendorId: deal.vendorId,
      action: "Dealer agreement uploaded and shared with vendor",
      status: sendResult.notification?.status === "failed" ? "failed" : "synced",
      reference: result.fileName,
    });

    if (sendResult.notification) {
      await recordDealSyncEvent({
        dealId: id,
        vendorId: deal.vendorId,
        action:
          sendResult.notification.status === "failed"
            ? "Dealer agreement email could not be delivered"
            : "Dealer agreement email sent to vendor",
        status:
          sendResult.notification.status === "failed"
            ? "failed"
            : sendResult.notification.status === "sent"
              ? "synced"
              : "queued",
        reference: sendResult.notification.reference ?? "Vendor notified",
      });
    }

    return NextResponse.json({
      ok: true,
      deal: updatedDeal,
      result,
      message:
        sendResult.notification?.status === "failed"
          ? "Dealer agreement uploaded and shared in the portal, but vendor email delivery failed."
          : "Dealer agreement uploaded and sent to the vendor.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to upload the dealer agreement." },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminRouteAccess();

  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const deal = await getDealById(id);

  if (!deal) {
    return NextResponse.json({ message: "Deal not found." }, { status: 404 });
  }

  let body: { action?: string };

  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return NextResponse.json({ message: "Invalid agreement action payload." }, { status: 400 });
  }

  if (body.action !== "mark_sent") {
    return NextResponse.json({ message: "Unsupported agreement action." }, { status: 400 });
  }

  try {
    const sendResult = await markDealerAgreementSent(id, { notifyVendor: true });

    await recordDealSyncEvent({
      dealId: id,
      vendorId: deal.vendorId,
      action: "Dealer agreement shared with vendor",
      status: sendResult.notification?.status === "failed" ? "failed" : "queued",
      reference: sendResult.deal.agreementFileName ?? "Agreement sent",
    });

    if (sendResult.notification) {
      await recordDealSyncEvent({
        dealId: id,
        vendorId: deal.vendorId,
        action:
          sendResult.notification.status === "failed"
            ? "Dealer agreement email could not be delivered"
            : "Dealer agreement email sent to vendor",
        status:
          sendResult.notification.status === "failed"
            ? "failed"
            : sendResult.notification.status === "sent"
              ? "synced"
              : "queued",
        reference: sendResult.notification.reference ?? "Vendor notified",
      });
    }

    return NextResponse.json({
      ok: true,
      deal: sendResult.deal,
      message:
        sendResult.notification?.status === "failed"
          ? "Dealer agreement is available in the portal, but vendor email delivery failed."
          : "Dealer agreement shared with the vendor.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update dealer agreement status." },
      { status: 400 }
    );
  }
}
