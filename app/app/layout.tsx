import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { WorkspaceLayout } from "@/components/product/workspace-layout";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import {
  listApprovedVendors,
  listDeals,
  listVendorApplications,
} from "@/lib/goaccess-store";
import type { WorkspaceNavItem } from "@/types/prm";

export const dynamic = "force-dynamic";

const vendorNavigation: WorkspaceNavItem[] = [
  { label: "Overview", href: "/app", group: "Workspace", icon: "home" },
  { label: "Applications", href: "/app/programs", group: "Vendor operations", icon: "applications" },
  { label: "Vendor roster", href: "/app/partners", group: "Vendor operations", icon: "vendors" },
  { label: "Deal review", href: "/app/deal-registrations", group: "Revenue operations", icon: "deals" },
  { label: "HubSpot sync", href: "/app/commissions", group: "Revenue operations", icon: "sync" },
  { label: "RMR ledger", href: "/app/payouts", group: "Revenue operations", icon: "revenue" },
  { label: "Learning", href: "/app/learning", group: "Resources", icon: "learning" },
  { label: "Documents", href: "/app/assets", group: "Resources", icon: "documents" },
  { label: "Support ops", href: "/app/settings", group: "Resources", icon: "support" },
];

export default async function VendorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [role, session] = await Promise.all([getWorkspaceRole(), getWorkspaceSession()]);

  if (role !== "admin" || !session) {
    redirect("/login?next=%2Fapp");
  }

  const [applications, vendors, deals] = await Promise.all([
    listVendorApplications(),
    listApprovedVendors(),
    listDeals(),
  ]);

  const vendorsById = new Map(vendors.map((vendor) => [vendor.id, vendor]));
  const globalSearchRecords = [
    ...deals.map((deal) => {
      const vendor = vendorsById.get(deal.vendorId);
      const location = [deal.city, deal.state].filter(Boolean).join(", ");
      return {
        id: `deal-${deal.id}`,
        type: "deal" as const,
        title: deal.companyName,
        subtitle: [vendor?.companyName, deal.contactName, deal.contactEmail, location]
          .filter(Boolean)
          .join(" · "),
        href: `/app/deal-registrations?deal=${encodeURIComponent(deal.id)}#deal-${encodeURIComponent(deal.id)}`,
        searchText: [
          deal.id,
          deal.companyName,
          vendor?.companyName,
          deal.contactName,
          deal.contactEmail,
          deal.communityAddress,
          deal.city,
          deal.state,
          deal.status,
          deal.hubspotCompanyId,
          deal.hubspotContactId,
          deal.hubspotDealId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      };
    }),
    ...vendors.map((vendor) => ({
      id: `vendor-${vendor.id}`,
      type: "vendor" as const,
      title: vendor.companyName,
      subtitle: [
        vendor.primaryContactName,
        vendor.primaryContactEmail,
        [vendor.city, vendor.state].filter(Boolean).join(", ") || vendor.region,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/app/partners#vendor-${encodeURIComponent(vendor.id)}`,
      searchText: [
        vendor.id,
        vendor.hubspotPartnerId,
        vendor.companyName,
        vendor.primaryContactName,
        vendor.primaryContactEmail,
        vendor.city,
        vendor.state,
        vendor.region,
        vendor.status,
        vendor.ndaStatus,
        vendor.portalAccess,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    })),
    ...applications.map((application) => ({
      id: `application-${application.id}`,
      type: "application" as const,
      title: application.companyName,
      subtitle: [
        application.primaryContactName,
        application.primaryContactEmail,
        [application.city, application.state].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/app/programs?application=${encodeURIComponent(application.id)}#application-${encodeURIComponent(application.id)}`,
      searchText: [
        application.id,
        application.companyName,
        application.primaryContactName,
        application.primaryContactEmail,
        application.city,
        application.state,
        application.region,
        application.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    })),
  ];

  return (
    <WorkspaceLayout
      brand="GoAccess"
      workspace="VENDOR ADMIN"
      navItems={vendorNavigation}
      session={session}
      globalSearchRecords={globalSearchRecords}
    >
      {children}
    </WorkspaceLayout>
  );
}
