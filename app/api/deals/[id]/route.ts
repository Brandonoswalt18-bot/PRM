import { NextResponse } from "next/server";
import { syncDealRegistrationToHubSpot } from "@/lib/hubspot";
import { getDealById, getVendorById, recordDealSyncEvent, updateDealStatus } from "@/lib/goaccess-store";
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
    if (body.status === "synced_to_hubspot") {
      const deal = await getDealById(id);

      if (!deal) {
        return NextResponse.json({ message: "Deal not found." }, { status: 404 });
      }

      const vendor = await getVendorById(deal.vendorId);

      if (!vendor) {
        return NextResponse.json({ message: "Approved vendor not found for this deal." }, { status: 404 });
      }

      try {
        const hubspot = await syncDealRegistrationToHubSpot({ vendor, deal });
        const updatedDeal = await updateDealStatus(id, body.status, {
          hubspotCompanyId: hubspot.companyId,
          hubspotContactId: hubspot.contactId,
          hubspotDealId: hubspot.dealId,
          syncAction: "Created or updated HubSpot company, contact, and deal",
          syncStatus: "synced",
          syncReference: `HS Deal #${hubspot.dealId}`,
        });

        return NextResponse.json({ ok: true, deal: updatedDeal });
      } catch (error) {
        await recordDealSyncEvent({
          dealId: deal.id,
          vendorId: deal.vendorId,
          action: "HubSpot sync failed during admin review",
          status: "failed",
          reference: error instanceof Error ? error.message : "HubSpot sync failed",
        });

        return NextResponse.json(
          {
            message:
              error instanceof Error
                ? error.message
                : "Unable to sync this deal to HubSpot.",
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
