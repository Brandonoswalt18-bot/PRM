import type {
  ApprovedVendor,
  DealStatus,
  VendorApplicationStatus,
  VendorStatus,
} from "@/types/goaccess";

export function humanizeSnakeCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatApplicationStatusLabel(status: VendorApplicationStatus) {
  switch (status) {
    case "submitted":
      return "New application";
    case "under_review":
      return "In review";
    case "approved":
      return "Approved";
    case "nda_sent":
      return "NDA sent";
    case "nda_signed":
      return "NDA signed";
    case "credentials_issued":
      return "Portal invite sent";
    case "rejected":
      return "Declined";
    default:
      return humanizeSnakeCase(status);
  }
}

export function formatApplicationActionLabel(status: VendorApplicationStatus) {
  switch (status) {
    case "under_review":
      return "Start review";
    case "approved":
      return "Approve";
    case "nda_sent":
      return "Send NDA email";
    case "nda_signed":
      return "Mark NDA signed";
    case "credentials_issued":
      return "Issue portal invite";
    default:
      return "Submitted";
  }
}

export function formatVendorStatusLabel(status: VendorStatus) {
  switch (status) {
    case "pending_nda":
      return "Waiting on NDA";
    case "onboarding":
      return "Onboarding";
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    default:
      return humanizeSnakeCase(status);
  }
}

export function formatNdaStatusLabel(status: ApprovedVendor["ndaStatus"]) {
  switch (status) {
    case "not_sent":
      return "Not sent";
    case "sent":
      return "Sent to vendor";
    case "signed":
      return "Signed";
    default:
      return humanizeSnakeCase(status);
  }
}

export function formatPortalAccessLabel(status: ApprovedVendor["portalAccess"]) {
  switch (status) {
    case "not_ready":
      return "Not ready";
    case "invited":
      return "Invite sent";
    case "active":
      return "Active";
    default:
      return humanizeSnakeCase(status);
  }
}

export function formatDealStatusLabel(status: DealStatus) {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "In review";
    case "approved":
      return "Approved for HubSpot";
    case "synced_to_hubspot":
      return "In HubSpot";
    case "closed_won":
      return "Closed won";
    case "closed_lost":
      return "Closed lost";
    case "rejected":
      return "Declined";
    default:
      return humanizeSnakeCase(status);
  }
}

export function getVendorNextStep(vendor: ApprovedVendor | null | undefined) {
  if (!vendor) {
    return "GoAccess is still reviewing your application.";
  }

  if (vendor.ndaStatus !== "signed") {
    return vendor.ndaStatus === "sent"
      ? "Download the NDA, sign it offline, and email the signed copy back to GoAccess."
      : "GoAccess still needs to send your NDA before portal setup can continue.";
  }

  if (!vendor.credentialsIssued) {
    return "GoAccess will issue your portal invite after the signed NDA is confirmed.";
  }

  if (vendor.portalAccess !== "active") {
    return "Use the invite email to create your password and activate portal access.";
  }

  return "Your account is ready. You can register deals and track recurring revenue here.";
}
