import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { WorkspaceLayout } from "@/components/product/workspace-layout";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import { getVendorById } from "@/lib/goaccess-store";
import type { WorkspaceNavItem } from "@/types/prm";

export const dynamic = "force-dynamic";

const partnerNavigation: WorkspaceNavItem[] = [
  { label: "Home", href: "/portal", group: "Workspace", icon: "home" },
  { label: "Agreements", href: "/portal/onboarding", group: "Workspace", icon: "documents" },
  { label: "Register deal", href: "/portal/links", group: "Deal pipeline", icon: "applications" },
  { label: "My deals", href: "/portal/deals", group: "Deal pipeline", icon: "deals" },
  { label: "Monthly RMR", href: "/portal/earnings", group: "Earnings", icon: "revenue" },
  { label: "Training library", href: "/portal/learning", group: "Training", icon: "learning" },
];

const legalOnboardingNavigation: WorkspaceNavItem[] = [
  { label: "Home", href: "/portal", group: "Workspace", icon: "home" },
  { label: "Agreements", href: "/portal/onboarding", group: "Required next step", icon: "documents" },
];

export default async function PartnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [role, session] = await Promise.all([getWorkspaceRole(), getWorkspaceSession()]);

  if (role !== "vendor" || !session?.vendorId) {
    redirect("/login?next=%2Fportal");
  }

  const vendor = await getVendorById(session.vendorId);
  const legalComplete = vendor?.ndaStatus === "signed" && Boolean(vendor.termsAcceptedAt);

  return (
    <WorkspaceLayout
      workspace="VENDOR PORTAL"
      navItems={legalComplete ? partnerNavigation : legalOnboardingNavigation}
      session={session}
    >
      {children}
    </WorkspaceLayout>
  );
}
