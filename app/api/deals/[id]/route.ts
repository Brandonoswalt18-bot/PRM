import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import {
  inspectDealRegistrationForHubSpot,
  syncDealRegistrationToHubSpot,
} from "@/lib/hubspot";
import {
  canTransitionDealStatus,
  getDealById,
  getVendorById,
  recordDealSyncEvent,
  updateDealMonthlyRmr,
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
      return "Deal approved, but HubSpot sync still needs attention.";
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

async function attemptDealHubSpotSync(
  deal: NonNullable<Awaited<ReturnType<typeof getDealById>>>,
  vendor: NonNullable<Awaited<ReturnType<typeof getVendorById>>>
) {
  const inspection = await inspectDealRegistrationForHubSpot({ vendor, deal });

  if (!inspection.ready) {
    const reference = inspection.heldReason ?? inspection.decisionSummary;

    await recordDealSyncEvent({
      dealId: deal.id,
      vendorId: deal.vendorId,
      action:
        inspection.syncDecision === "blocked_configuration"
          ? "Deal approved but HubSpot sync is blocked by configuration"
          : "Deal approved but HubSpot sync is blocked for review",
      status: "held",
      reference,
    });

    return {
      ok: false as const,
      inspection,
      reference,
    };
  }

  const hubspot = await syncDealRegistrationToHubSpot({ vendor, deal });
  const updatedDeal = await updateDealStatus(deal.id, "synced_to_hubspot", {
    hubspotCompanyId: hubspot.companyId,
    hubspotContactId: hubspot.contactId,
    hubspotDealId: hubspot.dealId,
    syncAction: "Deal approved and written to HubSpot",
    syncStatus: "synced",
    syncReference: `HS Deal #${hubspot.dealId}`,
  });

  return {
    ok: true as const,
    inspection,
    deal: updatedDeal,
  };
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
      vendor: toClientApprovedVendor(vendor),
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

  let body: { status?: DealStatus; monthlyRmr?: number | string };

  try {
    body = (await request.json()) as { status?: DealStatus; monthlyRmr?: number | string };
  } catch {
    return NextResponse.json({ message: "Invalid status payload." }, { status: 400 });
  }

  if (body.status && !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ message: "Unsupported deal status." }, { status: 400 });
  }

  const hasMonthlyRmr = body.monthlyRmr !== undefined && body.monthlyRmr !== null && body.monthlyRmr !== "";
  const monthlyRmr = hasMonthlyRmr ? Number(body.monthlyRmr) : null;

  if (hasMonthlyRmr && (!Number.isFinite(monthlyRmr) || (monthlyRmr ?? 0) < 0)) {
    return NextResponse.json({ message: "Enter a valid non-negative monthly RMR amount." }, { status: 400 });
  }

  if (!body.status && monthlyRmr === null) {
    return NextResponse.json({ message: "Choose a status or enter monthly RMR." }, { status: 400 });
  }

  try {
    let existingDeal = await getDealById(id);

    if (!existingDeal) {
      return NextResponse.json({ message: "Deal not found." }, { status: 404 });
    }

    if (body.status && !canTransitionDealStatus(existingDeal.status, body.status)) {
      return NextResponse.json(
        { message: `Cannot move a deal from ${existingDeal.status.replaceAll("_", " ")} to ${body.status.replaceAll("_", " ")}.` },
        { status: 409 }
      );
    }

    if (
      (body.status === "approved" || body.status === "synced_to_hubspot") &&
      (monthlyRmr ?? existingDeal.monthlyRmr) <= 0
    ) {
      return NextResponse.json(
        { message: "Enter the GoAccess monthly RMR amount before approving this deal." },
        { status: 400 }
      );
    }

    if (monthlyRmr !== null) {
      existingDeal = await updateDealMonthlyRmr(id, monthlyRmr);
    }

    if (!body.status) {
      return NextResponse.json({
        ok: true,
        deal: existingDeal,
        message: "Monthly RMR saved by GoAccess.",
      });
    }

    if (body.status === "approved") {
      const vendor = await getVendorById(existingDeal.vendorId);

      if (!vendor) {
        return NextResponse.json({ message: "Approved vendor not found for this deal." }, { status: 404 });
      }

      const approvedDeal = await updateDealStatus(id, "approved", {
        syncAction: "Deal approved. Automatic HubSpot handoff started",
        syncStatus: "queued",
        syncReference: "Running HubSpot readiness check",
      });

      try {
        const syncResult = await attemptDealHubSpotSync(approvedDeal, vendor);

        if (syncResult.ok) {
          return NextResponse.json({
            ok: true,
            deal: syncResult.deal,
            hubspot: syncResult.inspection,
            message: "Deal approved and written to HubSpot.",
          });
        }

        return NextResponse.json({
          ok: true,
          deal: approvedDeal,
          hubspot: syncResult.inspection,
          message: `Deal approved, but HubSpot sync is blocked: ${syncResult.reference}`,
        });
      } catch (error) {
        const reference = error instanceof Error ? error.message : "HubSpot sync failed";

        await recordDealSyncEvent({
          dealId: approvedDeal.id,
          vendorId: approvedDeal.vendorId,
          action: "Automatic HubSpot handoff failed after approval",
          status: "failed",
          reference,
        });

        return NextResponse.json({
          ok: true,
          deal: approvedDeal,
          message: `Deal approved, but automatic HubSpot delivery failed: ${reference}`,
        });
      }
    }

    if (body.status === "synced_to_hubspot") {
      const vendor = await getVendorById(existingDeal.vendorId);

      if (!vendor) {
        return NextResponse.json({ message: "Approved vendor not found for this deal." }, { status: 404 });
      }

      try {
        const syncResult = await attemptDealHubSpotSync(existingDeal, vendor);

        if (!syncResult.ok) {
          return NextResponse.json(
            {
              message: syncResult.reference,
              hubspot: syncResult.inspection,
            },
            { status: 409 }
          );
        }

        return NextResponse.json({
          ok: true,
          deal: syncResult.deal,
          hubspot: syncResult.inspection,
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
