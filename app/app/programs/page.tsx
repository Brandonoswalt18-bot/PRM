import {
  MetricGrid,
} from "@/components/product/product-page-sections";
import { AdminApplicationManager } from "@/components/product/admin-application-manager";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { listApprovedVendors, listVendorApplications, listVendorNotifications } from "@/lib/goaccess-store";

type ProgramsPageProps = {
  searchParams?: Promise<{
    queue?: string;
    application?: string;
  }>;
};

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const params = (await searchParams) ?? {};
  const [applications, vendors, notifications] = await Promise.all([
    listVendorApplications(),
    listApprovedVendors(),
    listVendorNotifications(),
  ]);

  const activeQueue =
    params.queue === "pending" || params.queue === "onboarding" ? params.queue : "all";
  const pendingApplications = applications.filter(
    (application) => application.status === "submitted" || application.status === "under_review"
  );
  const onboardingApplications = applications.filter((application) => {
    const vendor = vendors.find((item) => item.applicationId === application.id);

    if (!vendor) {
      return false;
    }

    return vendor.ndaStatus !== "signed" || !vendor.credentialsIssued || vendor.portalAccess !== "active";
  });

  const filteredApplications =
    activeQueue === "pending"
      ? pendingApplications
      : activeQueue === "onboarding"
        ? onboardingApplications
        : applications;

  const metrics = [
    {
      label: "Pending review",
      value: String(pendingApplications.length),
      delta: "New and under-review applications",
      href: "/app/programs?queue=pending",
    },
    {
      label: "NDA / portal holds",
      value: String(onboardingApplications.length),
      delta: "Approved vendors still mid-onboarding",
      href: "/app/programs?queue=onboarding",
    },
    {
      label: "Active vendors",
      value: String(vendors.filter((vendor) => vendor.portalAccess === "active").length),
      delta: "Approved vendors already in portal",
    },
  ];

  const selectedApplicationId = filteredApplications.some((application) => application.id === params.application)
    ? params.application
    : undefined;
  const primaryLabel = activeQueue === "all" ? "Review applications" : "Show full queue";
  const primaryHref = activeQueue === "all" ? "/app/programs" : "/app/programs";

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR ADMIN"
        title="Vendor applications"
        subtitle="Use the queue for quick triage, then open a partner when you need the full onboarding record."
        primaryLabel={primaryLabel}
        primaryHref={primaryHref}
      />
      <div className="app-content">
        <MetricGrid metrics={metrics} />
        <section className="dashboard-grid dashboard-grid-single">
          <AdminApplicationManager
            applications={filteredApplications}
            vendors={vendors}
            notifications={notifications}
            activeQueue={activeQueue}
            selectedApplicationId={selectedApplicationId}
            queueCounts={{
              all: applications.length,
              pending: pendingApplications.length,
              onboarding: onboardingApplications.length,
            }}
          />
        </section>
      </div>
    </>
  );
}
