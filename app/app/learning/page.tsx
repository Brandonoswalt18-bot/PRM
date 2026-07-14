import { AdminLearningManager } from "@/components/product/admin-learning-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listTrainingAssets } from "@/lib/goaccess-store";

export default async function AdminLearningPage() {
  const assets = await listTrainingAssets();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Training"
        subtitle="Upload training videos and documents for approved vendors."
        primaryLabel="Add training"
        primaryHref="#training-composer"
      />
      <div className="app-content workspace-page">
        <AdminLearningManager assets={assets} />
      </div>
    </>
  );
}
