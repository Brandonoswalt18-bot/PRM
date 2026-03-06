import {
  AssetRow,
  MetricGrid,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listTrainingAssets } from "@/lib/goaccess-store";
import type { AssetRecord, InfoListSection, MetricCard } from "@/types/prm";

function normalizeSourceLabel(source: string) {
  return source === "upload" ? "Internal" : "External";
}

function buildSections(): InfoListSection[] {
  return [
    {
      title: "Learning Library",
      description: "Legal, onboarding, and operating materials available to admins.",
      items: [
        "Prefer internal uploads for private operations",
        "Use external links for public references or SaaS docs",
        "Keep descriptions aligned to the vendor lifecycle step",
        "Review this list before publishing to the vendor-facing portal",
      ],
    },
    {
      title: "Upload policy",
      description: "Uploads can be private files or external links.",
      items: [
        "Upload path is versioned per asset type",
        "Store source, uploader, and timestamps in the shared portal store",
        "Only admin users can add or remove documents from this page",
      ],
    },
  ];
}

export default async function VendorAssetsPage() {
  const assets = await listTrainingAssets();
  const metrics: MetricCard[] = [
    {
      label: "Documents in library",
      value: String(assets.length),
      delta: `${assets.filter((asset) => asset.source === "upload").length} private uploads`,
    },
    {
      label: "External links",
      value: String(assets.filter((asset) => asset.source === "external").length),
      delta: "External resources available to admins",
    },
    {
      label: "Videos",
      value: String(assets.filter((asset) => asset.type === "video").length),
      delta: "Training media for demonstrations",
    },
    {
      label: "Documents",
      value: String(assets.filter((asset) => asset.type === "document").length),
      delta: "Playbooks, checklists, and onboarding reference files",
    },
  ];
  const rows: AssetRecord[] = assets.map((asset) => ({
    name: asset.title,
    type: `${asset.type} (${normalizeSourceLabel(asset.source)})`,
    audience: asset.source === "upload" ? "Admin and vendor" : "External reference",
    status: `Uploaded ${asset.uploadedBy}`,
  }));
  const sections = buildSections();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Documents"
        subtitle="Manage NDAs, onboarding guides, deal registration rules, and internal review documents in one place."
        primaryLabel="Upload document"
        primaryHref="/app/assets"
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Document library"
            description="A GoAccess-controlled source for legal, onboarding, and operating documents."
            actionLabel="Publish document"
            actionHref="/app/assets"
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
