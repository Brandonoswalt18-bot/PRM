import { formatVendorDealStatusLabel } from "@/lib/goaccess-copy";
import type { DealStatus } from "@/types/goaccess";

function getDealStatusTone(status: DealStatus) {
  if (status === "approved" || status === "closed_won" || status === "synced_to_hubspot") {
    return "status-pill-success";
  }

  if (status === "rejected" || status === "closed_lost") {
    return "status-pill-danger";
  }

  if (status === "submitted" || status === "under_review") {
    return "status-pill-warning";
  }

  return "status-pill-neutral";
}

export function VendorDealStatusPill({ status }: { status: DealStatus }) {
  return (
    <span className={`status-pill ${getDealStatusTone(status)}`}>
      {formatVendorDealStatusLabel(status)}
    </span>
  );
}
