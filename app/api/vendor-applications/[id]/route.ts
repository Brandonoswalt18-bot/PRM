import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import { buildInviteUrl, buildOnboardingUrl } from "@/lib/email";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import {
  canTransitionApplicationStatus,
  listApprovedVendors,
  listVendorApplications,
  reissueVendorInvite,
  updateVendorApplicationStatus,
} from "@/lib/goaccess-store";
import type { VendorApplicationStatus } from "@/types/goaccess";

const allowedStatuses: VendorApplicationStatus[] = [
  "under_review",
  "approved",
  "rejected",
  "nda_sent",
  "nda_signed",
  "credentials_issued",
];

function getApplicationStatusMessage(status: VendorApplicationStatus) {
  switch (status) {
    case "under_review":
      return "Application moved into review.";
    case "approved":
      return "Application approved. Next step: send the legal onboarding link.";
    case "nda_sent":
      return "Legal onboarding sent. The vendor must upload the NDA and accept the Partner Terms.";
    case "nda_signed":
      return "Signed NDA confirmed and Partner Terms recorded. Next step: issue portal access.";
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

  let body: { status?: VendorApplicationStatus; action?: "reissue_invite" };

  try {
    body = (await request.json()) as { status?: VendorApplicationStatus; action?: "reissue_invite" };
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
    const vendor = vendors.find((item) => item.applicationId === application.id) ?? null;

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
      message: getApplicationStatusMessage(body.status),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update application." },
      { status: 400 }
    );
  }
}
