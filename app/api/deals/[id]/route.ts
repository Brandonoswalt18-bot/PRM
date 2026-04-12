import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import {
  getHubSpotDealSyncConfig,
  inspectDealRegistrationForHubSpot,
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

function getDealStatusMessage(status: DealStatus) {
  switch (status) {
    case "under_review":
      return "Deal moved into review.";
    case "approved":
      return "Deal approved. Next step: sync it to HubSpot.";
    case "synced_to_hubspot":
      return "Deal approved and written to HubSpot.";
    case "closed_won":
      return "Deal marked closed won and counted toward recurring revenue.";
    case "closed_lost":
      return "Deal marked closed lost.";
    case "rejected":
      return "Deal marked as declined.";
    default:
      return "Deal updated.";
  }
}

export async function GET(
  _request: Request,
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

  const vendor = await getVendorById(deal.vendorId);

  if (!vendor) {
    return NextResponse.json({ message: "Approved vendor not found for this deal." }, { status: 404 });
  }

  try {
    const hubspot = await inspectDealRegistrationForHubSpot({ vendor, deal });

    return NextResponse.json({
      ok: true,
      deal,
      vendor,
      hubspot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to inspect HubSpot sync readiness.",
      },
      { status: 502 }
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
        const inspection = await inspectDealRegistrationForHubSpot({ vendor, deal: existingDeal });

        if (!inspection.ready) {
          const reference =
            inspection.heldReason ??
            inspection.decisionSummary;

          await recordDealSyncEvent({
            dealId: existingDeal.id,
            vendorId: existingDeal.vendorId,
            action:
              inspection.syncDecision === "blocked_configuration"
                ? "Deal sync held for HubSpot configuration review"
                : "Deal sync held for HubSpot duplicate review",
            status: "held",
            reference,
          });

          return NextResponse.json(
            {
              message: reference,
              hubspot: inspection,
            },
            { status: 409 }
          );
        }

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
    return NextResponse.json({
      ok: true,
      deal,
      message: getDealStatusMessage(body.status),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update deal." },
      { status: 404 }
    );
  }
}
