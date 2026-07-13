import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import { buildInviteUrl, buildOnboardingUrl } from "@/lib/email";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import {
  syncApprovedVendorCompanyToHubSpot,
  type HubSpotVendorCompanySyncResult,
} from "@/lib/hubspot";
import {
  canTransitionApplicationStatus,
  listApprovedVendors,
  listVendorApplications,
  recordVendorHubSpotCompanySync,
  reissueVendorInvite,
  updateVendorApplicationStatus,
} from "@/lib/goaccess-store";
import type { ApprovedVendor, VendorApplicationStatus } from "@/types/goaccess";

const allowedStatuses: VendorApplicationStatus[] = [
  "under_review",
  "approved",
  "rejected",
  "nda_sent",
  "nda_signed",
  "credentials_issued",
];

type ApprovalHubSpotCompanyHandoff =
  | HubSpotVendorCompanySyncResult
  | {
      status: "failed";
      action: "failed";
      companyId: string | null;
      reference: string;
    };

type VendorApplicationAction = "reissue_invite" | "retry_hubspot_company_sync";

async function runHubSpotCompanyHandoff(vendor: ApprovedVendor) {
  try {
    const result = await syncApprovedVendorCompanyToHubSpot(vendor);

    try {
      const updatedVendor = await recordVendorHubSpotCompanySync(vendor.id, {
        status: result.status,
        companyId: result.companyId ?? undefined,
        reference: result.reference,
      });
      return { vendor: updatedVendor, handoff: result };
    } catch (persistenceError) {
      const persistenceReference =
        persistenceError instanceof Error
          ? persistenceError.message
          : "Unable to save the HubSpot company mapping.";
      const handoff: ApprovalHubSpotCompanyHandoff = {
        status: "failed",
        action: "failed",
        companyId: result.companyId,
        reference: `HubSpot handoff completed, but its portal mapping could not be saved: ${persistenceReference}`,
      };
      return { vendor, handoff };
    }
  } catch (error) {
    const reference =
      error instanceof Error ? error.message : "Unable to complete the HubSpot company handoff.";
    const handoff: ApprovalHubSpotCompanyHandoff = {
      status: "failed",
      action: "failed",
      companyId: null,
      reference,
    };

    try {
      const updatedVendor = await recordVendorHubSpotCompanySync(vendor.id, {
        status: "failed",
        reference,
      });
      return { vendor: updatedVendor, handoff };
    } catch {
      return { vendor, handoff };
    }
  }
}

function getApplicationStatusMessage(status: VendorApplicationStatus) {
  switch (status) {
    case "under_review":
      return "Application moved into review.";
    case "approved":
      return "Application approved. Next step: send the legal onboarding link.";
    case "nda_sent":
      return "Legal onboarding sent. The vendor must accept the NDA and Partner Agreement.";
    case "nda_signed":
      return "Both legal agreements accepted. Next step: issue portal access.";
    case "credentials_issued":
      return "Portal invite issued. The vendor can now set a password and activate access.";
    case "rejected":
      return "Application marked as declined.";
    default:
      return "Application updated.";
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

  let body: { status?: VendorApplicationStatus; action?: VendorApplicationAction };

  try {
    body = (await request.json()) as {
      status?: VendorApplicationStatus;
      action?: VendorApplicationAction;
    };
  } catch {
    return NextResponse.json({ message: "Invalid status payload." }, { status: 400 });
  }

  if (body.action === "reissue_invite") {
    try {
      const result = await reissueVendorInvite(id);

      return NextResponse.json({
        ok: true,
        application: result.application,
        inviteUrl: result.inviteUrl,
        message:
          result.kind === "onboarding"
            ? "Legal onboarding link reissued. The previous link is no longer valid."
            : "Portal invite reissued. The previous password has been cleared.",
      });
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : "Unable to reissue invite." },
        { status: 404 }
      );
    }
  }

  if (body.action === "retry_hubspot_company_sync") {
    const vendors = await listApprovedVendors();
    const vendor = vendors.find((item) => item.applicationId === id);

    if (!vendor) {
      return NextResponse.json(
        { message: "Approve the vendor application before retrying HubSpot company sync." },
        { status: 409 }
      );
    }

    const result = await runHubSpotCompanyHandoff(vendor);
    const message =
      result.handoff.status === "synced"
        ? `HubSpot vendor company ${result.handoff.action}.`
        : result.handoff.status === "held"
          ? `HubSpot company handoff held: ${result.handoff.reference}`
          : `HubSpot company handoff failed: ${result.handoff.reference}`;

    return NextResponse.json(
      {
        ok: result.handoff.status !== "failed",
        vendor: toClientApprovedVendor(result.vendor),
        hubspotCompanyHandoff: result.handoff,
        message,
      },
      { status: result.handoff.status === "failed" ? 502 : 200 }
    );
  }

  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ message: "Unsupported application status." }, { status: 400 });
  }

  try {
    const applications = await listVendorApplications();
    const current = applications.find((item) => item.id === id);

    if (!current) {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }

    if (!canTransitionApplicationStatus(current.status, body.status)) {
      return NextResponse.json(
        { message: `Cannot move an application from ${current.status.replaceAll("_", " ")} to ${body.status.replaceAll("_", " ")}.` },
        { status: 409 }
      );
    }

    const application = await updateVendorApplicationStatus(id, body.status);
    const vendors = await listApprovedVendors();
    let vendor = vendors.find((item) => item.applicationId === application.id) ?? null;
    let hubspotCompanyHandoff: ApprovalHubSpotCompanyHandoff | undefined;
    let message = getApplicationStatusMessage(body.status);

    if (body.status === "approved" && vendor) {
      const result = await runHubSpotCompanyHandoff(vendor);
      vendor = result.vendor;
      hubspotCompanyHandoff = result.handoff;
      message =
        result.handoff.status === "synced"
          ? `${message} HubSpot vendor company ${result.handoff.action}.`
          : result.handoff.status === "held"
            ? `${message} HubSpot company handoff held: ${result.handoff.reference}`
            : `${message} HubSpot company handoff failed: ${result.handoff.reference}`;
    }

    return NextResponse.json({
      ok: true,
      application,
      vendor: vendor ? toClientApprovedVendor(vendor) : null,
      onboardingUrl:
        body.status === "nda_sent" && vendor?.inviteToken
          ? buildOnboardingUrl(vendor.inviteToken)
          : undefined,
      inviteUrl:
        body.status === "credentials_issued" && vendor?.inviteToken
          ? buildInviteUrl(vendor.inviteToken)
          : undefined,
      hubspotCompanyHandoff,
      message,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update application." },
      { status: 400 }
    );
  }
}
