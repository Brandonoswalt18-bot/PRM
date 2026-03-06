import { MetricGrid, SideSections, TableSection, AssetRow } from "@/components/product/product-page-sections";
import { VendorNdaManager } from "@/components/product/vendor-nda-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { getVendorById, listTrainingAssets } from "@/lib/goaccess-store";
import type { AssetRecord, InfoListSection, MetricCard } from "@/types/prm";

function normalizeSourceLabel(source: string) {
  return source === "upload" ? "Internal" : "External";
}

function buildSections(): InfoListSection[] {
  return [
    {
      title: "Vendor documents",
      description: "These assets are visible to approved GoAccess vendors.",
      items: [
        "Keep only current NDA and onboarding materials here.",
        "Do not upload confidential items without explicit vendor access.",
        "Use descriptions to make legal intent clear.",
      ],
    },
    {
      title: "Current status",
      description: "This page reflects documents attached in the shared portal store.",
      items: [
        "Upload a private file or add an external reference.",
        "Signed NDA is managed separately in account security settings.",
        "Track source and uploader for each item.",
      ],
    },
  ];
}

export default async function PartnerAssetsPage() {
  const session = await getWorkspaceSession();
  const vendor = session?.vendorId ? await getVendorById(session.vendorId) : null;
  const assets = await listTrainingAssets();
  const metrics: MetricCard[] = [
    {
      label: "Vendor documents",
      value: String(assets.length),
      delta: `${assets.filter((asset) => asset.source === "upload").length} private`,
    },
    {
      label: "External resources",
      value: String(assets.filter((asset) => asset.source === "external").length),
      delta: "Links included for quick handoff",
    },
    {
      label: "Available videos",
      value: String(assets.filter((asset) => asset.type === "video").length),
      delta: "Training and onboarding walkthroughs",
    },
    {
      label: "Available documents",
      value: String(assets.filter((asset) => asset.type === "document").length),
      delta: "Guides and policy references",
    },
  ];
  const rows: AssetRecord[] = assets.map((asset) => ({
    name: asset.title,
    type: `${asset.type} (${normalizeSourceLabel(asset.source)})`,
    audience: vendor ? "Approved vendors" : "Vendor audience",
    status: asset.source === "upload" ? `Uploaded by ${asset.uploadedBy}` : "External link",
  }));
  const sections = buildSections();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Documents"
        subtitle="Access the NDA, onboarding guides, and GoAccess operating documents tied to your approved vendor account."
        primaryLabel="Download NDA"
        primaryHref="/portal/assets"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <VendorNdaManager vendor={vendor} />
        <section className="dashboard-grid">
          <TableSection
            title="Available documents"
            description="Vendor-facing legal, onboarding, and operating files."
            actionLabel="Open file"
            actionHref="/portal/assets"
            headers={["Document", "Type", "Audience", "Status"]}
            rows={rows}
            renderRow={AssetRow}
          />
          <SideSections sections={sections} />
        </section>
      </div>
    </>
  );
}
