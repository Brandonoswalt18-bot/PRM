"use client";

import { useMemo, useState } from "react";
import type { DealRegistration, VendorApplication } from "@/types/goaccess";

type PerformanceRange = "daily" | "weekly" | "monthly";

const RANGE_OPTIONS: Array<{ id: PerformanceRange; label: string }> = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function isWithinRange(value: string | undefined, range: PerformanceRange) {
  if (!value) {
    return false;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const now = Date.now();
  const durationMs =
    range === "daily"
      ? 24 * 60 * 60 * 1000
      : range === "weekly"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

  return timestamp >= now - durationMs;
}

export function VendorPerformanceModule({
  application,
  deals,
}: {
  application: VendorApplication | null;
  deals: DealRegistration[];
}) {
  const [range, setRange] = useState<PerformanceRange>("monthly");

  const performance = useMemo(() => {
    const dealsRegistered = deals.filter((deal) => isWithinRange(deal.createdAt, range));
    const dealsApproved = deals.filter(
      (deal) =>
        ["approved", "synced_to_hubspot", "closed_won", "closed_lost"].includes(deal.status) &&
        isWithinRange(deal.updatedAt, range),
    );
    const dealsClosedWon = deals.filter(
      (deal) => deal.status === "closed_won" && isWithinRange(deal.updatedAt, range),
    );
    const rmrDeals = deals.filter(
      (deal) => deal.status === "closed_won" && isWithinRange(deal.updatedAt, range),
    );
    const earningsDeals = deals.filter(
      (deal) =>
        deal.expectedVendorMonthlyRevenue > 0 &&
        ["approved", "synced_to_hubspot", "closed_won"].includes(deal.status) &&
        isWithinRange(deal.updatedAt, range),
    );

    return {
      applicationsSubmitted: application && isWithinRange(application.createdAt, range) ? 1 : 0,
      dealsRegistered: dealsRegistered.length,
      dealsApproved: dealsApproved.length,
      dealsClosedWon: dealsClosedWon.length,
      totalMonthlyRmr: rmrDeals.reduce((sum, deal) => sum + deal.monthlyRmr, 0),
      expectedVendorEarnings: earningsDeals.reduce((sum, deal) => sum + deal.expectedVendorMonthlyRevenue, 0),
    };
  }, [application, deals, range]);

  const cards = [
    {
      label: "Applications submitted",
      value: String(performance.applicationsSubmitted),
      detail: "Your own vendor application activity in this timeframe.",
    },
    {
      label: "Deals registered",
      value: String(performance.dealsRegistered),
      detail: "New community submissions created during this window.",
    },
    {
      label: "Deals approved",
      value: String(performance.dealsApproved),
      detail: "Deals that moved into approval or beyond during this period.",
    },
    {
      label: "Deals closed won",
      value: String(performance.dealsClosedWon),
      detail: "Accounts that landed as active recurring revenue in this window.",
    },
    {
      label: "Total monthly RMR",
      value: formatCurrency(performance.totalMonthlyRmr),
      detail: "Closed-won recurring revenue added during the selected timeframe.",
    },
    {
      label: "Expected vendor earnings",
      value: formatCurrency(performance.expectedVendorEarnings),
      detail: "Projected monthly earnings from approved, active, and closed-won deals.",
    },
  ];

  return (
    <article className="workspace-card wide-card">
      <div className="card-header-row performance-header-row">
        <div>
          <span className="section-kicker">Performance</span>
          <h3>Your performance</h3>
          <p>Switch between daily, weekly, and monthly windows to see how your pipeline is moving.</p>
        </div>
        <div className="performance-toggle" role="tablist" aria-label="Performance timeframe">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`performance-toggle-pill${range === option.id ? " performance-toggle-pill-active" : ""}`}
              onClick={() => setRange(option.id)}
              role="tab"
              type="button"
              aria-selected={range === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="performance-grid">
        {cards.map((card) => (
          <div className="performance-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
