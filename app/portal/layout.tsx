import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { WorkspaceLayout } from "@/components/product/workspace-layout";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import { getVendorById } from "@/lib/goaccess-store";
import type { WorkspaceAccountItem, WorkspaceNavItem } from "@/types/prm";

export const dynamic = "force-dynamic";

const partnerNavigation: WorkspaceNavItem[] = [
  { label: "Home", href: "/portal", group: "Portal", icon: "home" },
  { label: "Agreements", href: "/portal/onboarding", group: "Portal", icon: "documents" },
  { label: "Deals", href: "/portal/deals", group: "Portal", icon: "deals" },
  { label: "Training", href: "/portal/learning", group: "Portal", icon: "learning" },
  { label: "Updates", href: "/portal/updates", group: "Portal", icon: "updates" },
];

const legalOnboardingNavigation: WorkspaceNavItem[] = [
  { label: "Agreements", href: "/portal/onboarding", group: "Required next step", icon: "documents" },
];

const partnerAccountItems: WorkspaceAccountItem[] = [
  { label: "Profile", href: "/portal/profile" },
  { label: "Support", href: "/portal/support" },
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
      accountItems={legalComplete ? partnerAccountItems : undefined}
      session={session}
    >
      {children}
    </WorkspaceLayout>
  );
}
