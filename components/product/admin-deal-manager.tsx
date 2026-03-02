"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import type { DealRegistration, DealStatus } from "@/types/goaccess";

type AdminDealManagerProps = {
  deals: DealRegistration[];
};

const actions: Array<{ label: string; status: DealStatus }> = [
  { label: "Under review", status: "under_review" },
  { label: "Approve", status: "approved" },
  { label: "Sync to HubSpot", status: "synced_to_hubspot" },
  { label: "Closed won", status: "closed_won" },
  { label: "Closed lost", status: "closed_lost" },
  { label: "Reject", status: "rejected" },
];

export function AdminDealManager({ deals }: AdminDealManagerProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function updateStatus(dealId: string, status: DealStatus) {
    setBusyId(dealId);
    setMessage("");

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setMessage(payload.message ?? "Unable to update deal.");
        setBusyId(null);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
      setMessage(`Deal updated to ${status.replaceAll("_", " ")}.`);
    } catch {
      setMessage("Network error while updating deal.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row">
        <div>
          <h3>Live deal review queue</h3>
          <p>Approve or reject vendor-submitted opportunities before they write into HubSpot.</p>
        </div>
      </div>
      {message ? <p className="table-note">{message}</p> : null}
      <div className="stack-list">
        {deals.map((deal) => (
          <div className="stack-card" key={deal.id}>
            <div className="stack-card-header">
              <div>
                <h3>{deal.companyName}</h3>
                <p>
                  {deal.domain} · {deal.contactName} · ${deal.estimatedValue.toLocaleString()}
                </p>
              </div>
              <span className="status-pill">{deal.status.replaceAll("_", " ")}</span>
            </div>
            <div className="stack-meta-grid">
              <span>{deal.contactEmail}</span>
              <span>{deal.productInterest}</span>
              <span>${deal.monthlyRmr.toLocaleString()} monthly RMR</span>
            </div>
            {deal.notes ? <p className="stack-note">{deal.notes}</p> : null}
            {deal.hubspotDealId ? (
              <p className="stack-note">HubSpot deal: #{deal.hubspotDealId}</p>
            ) : null}
            <div className="action-row">
              {actions.map((action) => (
                <button
                  className="button button-secondary"
                  key={action.status}
                  type="button"
                  disabled={busyId === deal.id}
                  onClick={() => updateStatus(deal.id, action.status)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
