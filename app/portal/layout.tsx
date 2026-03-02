import type { ReactNode } from "react";
import { WorkspaceLayout } from "@/components/product/workspace-layout";
import { getPartnerNavigation } from "@/lib/mock-data";
import { getWorkspaceSession } from "@/lib/auth";

export default async function PartnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, navItems] = await Promise.all([
    getWorkspaceSession(),
    getPartnerNavigation(),
  ]);

  return (
    <WorkspaceLayout
      brand="Relay PRM"
      workspace="PARTNER PORTAL"
      navItems={navItems}
      session={
        session ?? {
          fullName: "Unknown user",
          email: "unknown",
          role: "Partner",
          organization: "Unknown",
        }
      }
    >
      {children}
    </WorkspaceLayout>
  );
}
