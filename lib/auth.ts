import { SESSION_COOKIE } from "@/lib/auth-constants";
import { readSignedSession } from "@/lib/auth-session";
import type { WorkspaceSession } from "@/types/prm";

export type WorkspaceRole = "admin" | "vendor";

export function normalizeWorkspaceRole(rawRole: string | null | undefined): WorkspaceRole | null {
  if (!rawRole) {
    return null;
  }

  if (rawRole === "admin" || rawRole === "vendor") {
    return rawRole;
  }

  if (rawRole === "partner") {
    return "vendor";
  }

  return null;
}

export function resolveWorkspaceDestination(
  role: WorkspaceRole,
  nextPath?: string | null
) {
  if (nextPath?.startsWith("/")) {
    if (role === "admin" && nextPath.startsWith("/app")) {
      return nextPath;
    }

    if (role === "vendor" && nextPath.startsWith("/portal")) {
      return nextPath;
    }
  }

  return role === "admin" ? "/app" : "/portal";
}

export async function getWorkspaceRole(): Promise<WorkspaceRole | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const session = await readSignedSession(cookieStore.get(SESSION_COOKIE)?.value);
  return session ? normalizeWorkspaceRole(session.role) : null;
}

export async function getWorkspaceSession(): Promise<WorkspaceSession | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const signedSession = await readSignedSession(cookieStore.get(SESSION_COOKIE)?.value);
  const role = signedSession ? normalizeWorkspaceRole(signedSession.role) : null;
  const vendorId = signedSession?.vendorId;

  if (role === "admin") {
    return {
      fullName: "Maya Chen",
      email: signedSession?.email ?? "maya@goaccess.com",
      role: "GoAccess Admin",
      organization: "GoAccess",
    };
  }

  if (role === "vendor") {
    const { getVendorById } = await import("@/lib/goaccess-store");
    const vendor = await getVendorById(vendorId ?? "vendor-blue-haven");

    return {
      fullName: vendor?.primaryContactName ?? "Jordan Lee",
      email: signedSession?.email ?? vendor?.primaryContactEmail ?? "jordan@bluehavenintegrators.com",
      role: "Vendor",
      organization: vendor?.companyName ?? "Blue Haven Integrators",
      vendorId: vendor?.id ?? "vendor-blue-haven",
    };
  }

  return null;
}
