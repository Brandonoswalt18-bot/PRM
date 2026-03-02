import type { WorkspaceSession } from "@/types/prm";

export type WorkspaceRole = "vendor" | "partner";

export const SESSION_COOKIE = "relay_role";

export async function getWorkspaceRole(): Promise<WorkspaceRole | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const role = cookieStore.get(SESSION_COOKIE)?.value;

  if (role === "vendor" || role === "partner") {
    return role;
  }

  return null;
}

export async function getWorkspaceSession(): Promise<WorkspaceSession | null> {
  const role = await getWorkspaceRole();

  if (role === "vendor") {
    return {
      fullName: "Maya Chen",
      email: "maya@relayprm.com",
      role: "Partner Manager",
      organization: "Relay PRM",
    };
  }

  if (role === "partner") {
    return {
      fullName: "Jordan Lee",
      email: "jordan@growthlabs.co",
      role: "Agency Partner",
      organization: "Growth Labs",
    };
  }

  return null;
}
