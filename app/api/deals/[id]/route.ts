import { NextResponse } from "next/server";
import {
  getHubSpotDealSyncConfig,
  isHubSpotDealSyncEnabled,
  syncDealRegistrationToHubSpot,
} from "@/lib/hubspot";
import {
  canTransitionDealStatus,
  getDealById,
  getVendorById,
  recordDealSyncEvent,
  updateDealStatus,
} from "@/lib/goaccess-store";
import type { DealStatus } from "@/types/goaccess";

const allowedStatuses: DealStatus[] = [
  "under_review",
  "approved",
  "synced_to_hubspot",
  "closed_won",
  "closed_lost",
  "rejected",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let body: { status?: DealStatus };

  try {
    body = (await request.json()) as { status?: DealStatus };
  } catch {
    return NextResponse.json({ message: "Invalid status payload." }, { status: 400 });
  }

  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ message: "Unsupported deal status." }, { status: 400 });
  }

  try {
    const existingDeal = await getDealById(id);

    if (!existingDeal) {
      return NextResponse.json({ message: "Deal not found." }, { status: 404 });
    }

    if (!canTransitionDealStatus(existingDeal.status, body.status)) {
      return NextResponse.json(
        { message: `Cannot move a deal from ${existingDeal.status.replaceAll("_", " ")} to ${body.status.replaceAll("_", " ")}.` },
        { status: 409 }
      );
    }

    if (body.status === "approved") {
      const approvedDeal = await updateDealStatus(id, "approved", {
        syncAction: "Deal approved and ready for HubSpot sync",
        syncStatus: "held",
        syncReference: "Awaiting HubSpot sync",
      });

      return NextResponse.json({
        ok: true,
        deal: approvedDeal,
        message: "Deal approved. Sync it to HubSpot when ready.",
      });
    }

    if (body.status === "synced_to_hubspot") {
      const vendor = await getVendorById(existingDeal.vendorId);

      if (!vendor) {
        return NextResponse.json({ message: "Approved vendor not found for this deal." }, { status: 404 });
      }

      if (!isHubSpotDealSyncEnabled()) {
        const config = getHubSpotDealSyncConfig();
        return NextResponse.json(
          {
            message: `HubSpot deal sync is not configured. Missing: ${config.missingEnvVars.join(", ")}.`,
          },
          { status: 503 }
        );
      }

      try {
        const hubspot = await syncDealRegistrationToHubSpot({ vendor, deal: existingDeal });
        const updatedDeal = await updateDealStatus(id, "synced_to_hubspot", {
          hubspotCompanyId: hubspot.companyId,
          hubspotContactId: hubspot.contactId,
          hubspotDealId: hubspot.dealId,
          syncAction: "Deal approved and written to HubSpot",
          syncStatus: "synced",
          syncReference: `HS Deal #${hubspot.dealId}`,
        });

        return NextResponse.json({
          ok: true,
          deal: updatedDeal,
          message: "Deal approved and written to HubSpot.",
        });
      } catch (error) {
        await recordDealSyncEvent({
          dealId: existingDeal.id,
          vendorId: existingDeal.vendorId,
          action: "Deal approval could not be written to HubSpot",
          status: "failed",
          reference: error instanceof Error ? error.message : "HubSpot sync failed",
        });

        return NextResponse.json(
          {
            message:
              error instanceof Error
                ? error.message
                : "Unable to write this approved deal to HubSpot.",
          },
          { status: 502 }
        );
      }
    }

    const deal = await updateDealStatus(id, body.status);
    return NextResponse.json({ ok: true, deal });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update deal." },
      { status: 404 }
    );
  }
}
