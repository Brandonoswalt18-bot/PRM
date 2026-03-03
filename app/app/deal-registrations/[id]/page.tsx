import { notFound } from "next/navigation";
import {
  MetricGrid,
  ProfileRow,
  TableSection,
  TimelineSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { buildDealTimeline } from "@/lib/goaccess-timeline";
import {
  formatCurrency,
  getDealById,
  getVendorById,
  listSupportRequests,
  listSyncEvents,
} from "@/lib/goaccess-store";

function titleCase(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AdminDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deal, syncEvents] = await Promise.all([getDealById(id), listSyncEvents()]);

  if (!deal) {
    notFound();
  }

  const [vendor, relatedSupportRequests] = await Promise.all([
    getVendorById(deal.vendorId),
    listSupportRequests(deal.vendorId),
  ]);

  const metrics = [
    {
      label: "Deal status",
      value: titleCase(deal.status),
      delta: deal.hubspotDealId ? `HubSpot #${deal.hubspotDealId}` : "No HubSpot deal yet",
    },
    {
      label: "Estimated value",
      value: formatCurrency(deal.estimatedValue),
      delta: "Submitted vendor opportunity value",
    },
    {
      label: "Monthly RMR",
      value: formatCurrency(deal.monthlyRmr),
      delta: deal.status === "closed_won" ? "Active recurring revenue" : "Forecasted recurring revenue",
    },
    {
      label: "Open support issues",
      value: String(
        relatedSupportRequests.filter((request) => request.status !== "resolved").length
      ),
      delta: "Vendor requests that may affect this account",
    },
  ];

  const profileRows = [
    { label: "Vendor", value: vendor?.companyName ?? "Unknown vendor" },
    { label: "Vendor contact", value: vendor?.primaryContactName ?? "Unknown contact" },
    { label: "Vendor email", value: vendor?.primaryContactEmail ?? "Unknown email" },
    { label: "Account", value: deal.companyName },
    { label: "Domain", value: deal.domain },
    { label: "Buyer contact", value: deal.contactName },
    { label: "Buyer email", value: deal.contactEmail },
    { label: "Buyer phone", value: deal.contactPhone || "Not provided" },
    { label: "Product interest", value: deal.productInterest },
    { label: "Notes", value: deal.notes || "No notes provided" },
  ];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title={deal.companyName}
        subtitle="Inspect the full registration, vendor context, and HubSpot sync history before taking action."
        primaryLabel="Back to review queue"
        primaryHref="/app/deal-registrations"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Registration record"
            description="The exact account details submitted through the vendor portal."
            actionLabel="Open vendor support"
            actionHref="/app/settings"
            headers={["Field", "Value"]}
            rows={profileRows}
            renderRow={ProfileRow}
          />
        </section>
        <section className="dashboard-grid">
          <TimelineSection
            title="Review and sync timeline"
            description="Submission, review decisions, HubSpot writes, and final outcomes."
            entries={buildDealTimeline(deal, syncEvents)}
          />
        </section>
      </div>
    </>
  );
}
