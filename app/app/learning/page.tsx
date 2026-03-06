import { AdminLearningManager } from "@/components/product/admin-learning-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listTrainingAssets } from "@/lib/goaccess-store";

export default async function AdminLearningPage() {
  const assets = await listTrainingAssets();

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Learning"
        subtitle="Upload training videos and documents for approved vendors."
        primaryLabel="Manage library"
        primaryHref="/app/learning"
      />
      <div className="app-content">
        <AdminLearningManager assets={assets} />
      </div>
    </>
  );
}
