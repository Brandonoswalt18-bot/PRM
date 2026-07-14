import {
  ProfileRow,
  SideSections,
  TableSection,
} from "@/components/product/product-page-sections";
import { VendorProfileForm } from "@/components/product/vendor-profile-form";
import { WorkspacePageHeader } from "@/components/product/workspace-page-header";
import { getWorkspaceSession } from "@/lib/auth";
import { toClientApprovedVendor } from "@/lib/goaccess-client-data";
import {
  formatNdaStatusLabel,
  formatVendorStatusLabel,
  getVendorNextStep,
} from "@/lib/goaccess-copy";
import { getVendorById } from "@/lib/goaccess-store";
import type { InfoListSection, ProfileField } from "@/types/prm";

function buildSections(
  vendor: Awaited<ReturnType<typeof getVendorById>>,
): InfoListSection[] {
  return [
    {
      title: "Account status",
      items: [
        `Account stage: ${vendor ? formatVendorStatusLabel(vendor.status) : "Pending"}`,
        `NDA: ${vendor ? formatNdaStatusLabel(vendor.ndaStatus) : "Not started"}`,
        `Portal access: ${vendor?.portalAccess === "active" ? "Active" : "Pending"}`,
      ],
    },
    {
      title: "Keep your profile current",
      items: [
        "Update company and contact details when they change",
        "Use Support if a correction needs GoAccess assistance",
        getVendorNextStep(vendor),
      ],
    },
  ];
}

export default async function PartnerProfilePage() {
  const session = await getWorkspaceSession();
  const vendor = session?.vendorId ? await getVendorById(session.vendorId) : null;
  const profileRows: ProfileField[] = vendor
    ? [
        { label: "Company", value: vendor.companyName },
        { label: "Contact", value: vendor.primaryContactName },
        { label: "Email", value: vendor.primaryContactEmail },
        { label: "Website", value: vendor.website },
        { label: "Region", value: vendor.region },
        { label: "Vendor type", value: vendor.vendorType },
        ...(vendor.city ? [{ label: "City", value: vendor.city }] : []),
        ...(vendor.state ? [{ label: "State", value: vendor.state }] : []),
        { label: "Account stage", value: formatVendorStatusLabel(vendor.status) },
        { label: "NDA status", value: formatNdaStatusLabel(vendor.ndaStatus) },
        { label: "Portal access", value: vendor.portalAccess === "active" ? "Active" : "Pending" },
      ]
    : [];

  return (
    <>
      <WorkspacePageHeader
        workspace="VENDOR PORTAL"
        title="Profile"
        subtitle="Keep your company and primary contact details current."
        primaryLabel="Back to home"
        primaryHref="/portal"
      />
      <div className="app-content">
        <section className="dashboard-grid">
          {vendor ? <VendorProfileForm vendor={toClientApprovedVendor(vendor)} /> : null}
          <TableSection
            title="Account snapshot"
            description="The approved vendor information GoAccess uses for agreements and deal review."
            actionLabel="Open agreements"
            actionHref="/portal/onboarding"
            headers={["Field", "Value"]}
            rows={profileRows}
            renderRow={ProfileRow}
          />
        </section>
        <section className="dashboard-grid">
          <SideSections sections={buildSections(vendor)} />
        </section>
      </div>
    </>
  );
}
