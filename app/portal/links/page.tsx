import {
  LinkRow,
  MetricGrid,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getLinksPageData } from "@/lib/mock-data";

export default async function LinksPage() {
  const data = await getLinksPageData();

  return (
    <>
      <WorkspacePageHeader
        workspace="PARTNER PORTAL"
        title="Links"
        subtitle="Tracked links and referral codes are the fastest way for partners to start generating attributed pipeline."
        primaryLabel="Create link"
      />
      <div className="app-content">
        <MetricGrid metrics={data.metrics} />
        <section className="dashboard-grid">
          <TableSection
            title="Link performance"
            description="Campaign-level visibility into what partners are sharing and what is converting."
            actionLabel="Copy referral code"
            headers={["Asset", "Destination", "Clicks", "Conversions"]}
            rows={data.links}
            renderRow={LinkRow}
          />
          <SideSections sections={data.sections} />
        </section>
      </div>
    </>
  );
}
