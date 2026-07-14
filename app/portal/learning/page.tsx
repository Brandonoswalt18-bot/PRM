import { TrainingLibrary } from "@/components/product/training-library";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listTrainingAssets } from "@/lib/goaccess-store";

export default async function VendorLearningPage() {
  const assets = await listTrainingAssets();
  const videos = assets.filter((asset) => asset.type === "video");
  const documents = assets.filter((asset) => asset.type === "document");
  const latestAsset = videos[0] ?? documents[0];
  const latestAssetHref = latestAsset
    ? latestAsset.source === "external" && latestAsset.externalUrl
      ? latestAsset.externalUrl
      : `/api/training-assets/file?id=${latestAsset.id}`
    : "/portal/learning";

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Training"
        subtitle="Open the training videos and documents your team needs to start selling and supporting GoAccess."
        primaryLabel={latestAsset ? "Open latest training" : "Training"}
        primaryHref={latestAssetHref}
      />
      <div className="app-content learning-page">
        <section className="learning-library-layout">
          <article className="workspace-card learning-panel learning-video-panel">
            <div className="learning-panel-header">
              <div>
                <span className="learning-panel-eyebrow">Video library</span>
                <h3>Training videos</h3>
                <p>Recorded walkthroughs for vendor onboarding and portal operations.</p>
              </div>
              <span className="learning-panel-count">{videos.length} available</span>
            </div>
            <TrainingLibrary
              assets={videos}
              emptyMessage="No videos have been published yet."
              emptyTitle="Training videos"
              variant="vendor"
            />
          </article>

          <article className="workspace-card learning-panel learning-document-panel">
            <div className="learning-panel-header">
              <div>
                <span className="learning-panel-eyebrow">Downloads</span>
                <h3>Training documents</h3>
                <p>Downloadable guides, process notes, and supporting material.</p>
              </div>
              <span className="learning-panel-count is-neutral">{documents.length} available</span>
            </div>
            <TrainingLibrary
              assets={documents}
              emptyMessage="No documents have been published yet."
              emptyTitle="Training documents"
              variant="vendor"
            />
          </article>
        </section>
      </div>
    </>
  );
}
