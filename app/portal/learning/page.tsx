import { TrainingLibrary } from "@/components/product/training-library";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listTrainingAssets } from "@/lib/goaccess-store";

export default async function VendorLearningPage() {
  const assets = await listTrainingAssets();
  const videos = assets.filter((asset) => asset.type === "video");
  const documents = assets.filter((asset) => asset.type === "document");

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Learning"
        subtitle="Watch GoAccess training videos and open onboarding documents in one place."
        primaryLabel="Open latest training"
        primaryHref="/portal/learning"
      />
      <div className="app-content">
        <section className="dashboard-grid">
          <article className="workspace-card wide-card">
            <div className="card-header-row">
              <div>
                <h3>Training videos</h3>
                <p>Recorded walkthroughs for vendor onboarding and portal operations.</p>
              </div>
            </div>
            <TrainingLibrary
              assets={videos}
              emptyMessage="No videos have been published yet."
              emptyTitle="Training videos"
            />
          </article>

          <article className="workspace-card">
            <div className="card-header-row">
              <div>
                <h3>Training documents</h3>
                <p>Downloadable guides, process notes, and supporting material.</p>
              </div>
            </div>
            <TrainingLibrary
              assets={documents}
              emptyMessage="No documents have been published yet."
              emptyTitle="Training documents"
            />
          </article>
        </section>
      </div>
    </>
  );
}
