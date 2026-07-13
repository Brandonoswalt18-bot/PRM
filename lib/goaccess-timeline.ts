import type {
  ApprovedVendor,
  DealRegistration,
  DealSyncEvent,
  SupportRequest,
  TimelineEntry,
  VendorApplication,
  VendorNotification,
} from "@/types/goaccess";

function titleCaseStatus(value: string) {
  return value.replaceAll("_", " ");
}

export function buildApplicationTimeline(
  application: VendorApplication,
  vendor: ApprovedVendor | null,
  notifications: VendorNotification[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      title: "Application submitted",
      detail: `${application.companyName} entered the GoAccess review queue.`,
      timestamp: application.createdAt,
      tone: "neutral",
    },
  ];

  if (application.status === "under_review" || application.status === "approved" || vendor) {
    entries.push({
      title: "Review started",
      detail: "GoAccess opened the vendor application for internal review.",
      timestamp: application.updatedAt,
      tone: "neutral",
    });
  }

  if (application.approvalEmailSentAt) {
    entries.push({
      title: "Approved for onboarding",
      detail: `Vendor ID ${vendor?.hubspotPartnerId ?? "pending"} assigned and onboarding approved.`,
      timestamp: application.approvalEmailSentAt,
      tone: "success",
    });
  }

  if (application.ndaSentAt) {
    entries.push({
      title: "Legal onboarding sent",
      detail: "The vendor received the secure NDA and Partner Agreement checklist.",
      timestamp: application.ndaSentAt,
      tone: "warning",
    });
  }

  if (vendor?.ndaSignedAt) {
    entries.push({
      title: "NDA accepted",
      detail: `${vendor.ndaAcceptedBy ?? vendor.primaryContactName} accepted version ${vendor.ndaVersion ?? "current"}.`,
      timestamp: vendor.ndaSignedAt,
      tone: "success",
    });
  }

  if (vendor?.termsAcceptedAt) {
    entries.push({
      title: "Partner Agreement accepted",
      detail: `${vendor.termsAcceptedBy ?? vendor.primaryContactName} accepted version ${vendor.termsVersion ?? "current"}.`,
      timestamp: vendor.termsAcceptedAt,
      tone: "success",
    });
  }

  if (application.ndaSignedAt) {
    entries.push({
      title: "Legal onboarding complete",
      detail: "Both click-through agreements were accepted and recorded.",
      timestamp: application.ndaSignedAt,
      tone: "success",
    });
  }

  if (application.credentialsIssuedAt) {
    entries.push({
      title: "Credentials issued",
      detail: vendor?.inviteAcceptedAt
        ? "Portal credentials were issued and accepted."
        : "Portal credentials were issued and invite is pending acceptance.",
      timestamp: application.credentialsIssuedAt,
      tone: "success",
    });
  }

  if (vendor?.inviteAcceptedAt) {
    entries.push({
      title: "Vendor activated portal access",
      detail: "The invite link was accepted and the vendor portal is active.",
      timestamp: vendor.inviteAcceptedAt,
      tone: "success",
    });
  }

  if (application.status === "rejected") {
    entries.push({
      title: "Application rejected",
      detail: "The application was closed without vendor activation.",
      timestamp: application.updatedAt,
      tone: "danger",
    });
  }

  for (const notification of notifications) {
    entries.push({
      title: notification.subject,
      detail: `Email ${notification.status}${notification.reference ? ` · ${notification.reference}` : ""}`,
      timestamp: notification.createdAt,
      tone:
        notification.status === "failed"
          ? "danger"
          : notification.status === "sent"
            ? "success"
            : "neutral",
    });
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function buildDealTimeline(
  deal: DealRegistration,
  syncEvents: DealSyncEvent[]
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      title: "Deal submitted",
      detail: `${deal.companyName} was registered in the vendor portal.`,
      timestamp: deal.createdAt,
      tone: "neutral",
    },
  ];

  for (const event of syncEvents.filter((item) => item.dealId === deal.id)) {
    entries.push({
      title: event.action,
      detail: event.reference,
      timestamp: event.createdAt,
      tone:
        event.status === "failed"
          ? "danger"
          : event.status === "held"
            ? "warning"
            : event.status === "synced"
              ? "success"
              : "neutral",
    });
  }

  if (deal.hubspotDealId) {
    entries.push({
      title: "HubSpot deal linked",
      detail: `HubSpot deal #${deal.hubspotDealId} is attached to this registration.`,
      timestamp: deal.updatedAt,
      tone: "success",
    });
  }

  if (deal.agreementUploadedAt) {
    entries.push({
      title: "Dealer agreement uploaded",
      detail: deal.agreementFileName
        ? `${deal.agreementFileName} was attached to this closed deal.`
        : "A dealer agreement file was attached to this closed deal.",
      timestamp: deal.agreementUploadedAt,
      tone: "neutral",
    });
  }

  if (deal.agreementSentAt) {
    entries.push({
      title: "Dealer agreement shared with vendor",
      detail: "The vendor can now review the agreement and return a signed copy in the portal.",
      timestamp: deal.agreementSentAt,
      tone: "warning",
    });
  }

  if (deal.agreementSignedAt) {
    entries.push({
      title: "Signed dealer agreement stored",
      detail: deal.signedAgreementFileName
        ? `${deal.signedAgreementFileName} is now attached to this deal.`
        : "The signed dealer agreement is now attached to this deal.",
      timestamp: deal.agreementSignedAt,
      tone: "success",
    });
  }

  if (deal.status === "closed_won" || deal.status === "closed_lost") {
    entries.push({
      title: `Deal marked ${titleCaseStatus(deal.status)}`,
      detail:
        deal.status === "closed_won"
          ? `Recurring revenue of $${deal.monthlyRmr.toLocaleString()} is now active.`
          : "This opportunity is closed and no longer active in the pipeline.",
      timestamp: deal.updatedAt,
      tone: deal.status === "closed_won" ? "success" : "danger",
    });
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function buildVendorDealTimeline(deal: DealRegistration): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      title: "Deal submitted",
      detail: `${deal.companyName} was sent to GoAccess for review.`,
      timestamp: deal.createdAt,
      tone: "neutral",
    },
  ];

  if (deal.status === "under_review") {
    entries.push({
      title: "GoAccess review in progress",
      detail: "The GoAccess team is reviewing the registration and will handle the next step.",
      timestamp: deal.updatedAt,
      tone: "warning",
    });
  }

  if (deal.status === "approved" || deal.status === "synced_to_hubspot") {
    entries.push({
      title: "Deal approved",
      detail: "GoAccess approved this registration and is handling the remaining internal steps.",
      timestamp: deal.updatedAt,
      tone: "success",
    });
  }

  if (deal.status === "rejected") {
    entries.push({
      title: "Deal declined",
      detail: "GoAccess completed its review and declined this registration.",
      timestamp: deal.updatedAt,
      tone: "danger",
    });
  }

  if (deal.agreementUploadedAt) {
    entries.push({
      title: "Dealer agreement ready",
      detail: deal.agreementFileName
        ? `${deal.agreementFileName} is available for review.`
        : "The dealer agreement is available for review.",
      timestamp: deal.agreementUploadedAt,
      tone: "neutral",
    });
  }

  if (deal.agreementSentAt) {
    entries.push({
      title: "Dealer agreement awaiting signature",
      detail: "Review the agreement and upload the signed copy in the portal.",
      timestamp: deal.agreementSentAt,
      tone: "warning",
    });
  }

  if (deal.agreementSignedAt) {
    entries.push({
      title: "Signed dealer agreement received",
      detail: deal.signedAgreementFileName
        ? `${deal.signedAgreementFileName} is stored with this deal.`
        : "The signed dealer agreement is stored with this deal.",
      timestamp: deal.agreementSignedAt,
      tone: "success",
    });
  }

  if (deal.status === "closed_won" || deal.status === "closed_lost") {
    entries.push({
      title: deal.status === "closed_won" ? "Deal closed won" : "Deal closed lost",
      detail:
        deal.status === "closed_won"
          ? `Recurring revenue of $${deal.monthlyRmr.toLocaleString()} is now active.`
          : "This opportunity is closed and no longer active in the pipeline.",
      timestamp: deal.updatedAt,
      tone: deal.status === "closed_won" ? "success" : "danger",
    });
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function buildSupportTimeline(request: SupportRequest): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      title: "Support request submitted",
      detail: request.message,
      timestamp: request.createdAt,
      tone: "neutral",
    },
  ];

  if (request.status === "in_progress" || request.status === "resolved") {
    entries.push({
      title: "GoAccess is reviewing this request",
      detail: "The request was acknowledged and moved into active handling.",
      timestamp: request.updatedAt,
      tone: "warning",
    });
  }

  if (request.status === "resolved") {
    entries.push({
      title: "Support request resolved",
      detail: "The request was closed by the GoAccess team.",
      timestamp: request.updatedAt,
      tone: "success",
    });
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
