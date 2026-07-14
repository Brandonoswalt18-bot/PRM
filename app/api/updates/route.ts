import { NextResponse } from "next/server";
import { getWorkspaceSession } from "@/lib/auth";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import { createPartnerUpdate, listPartnerUpdates } from "@/lib/goaccess-store";
import { parseCreatePartnerUpdatePayload } from "./payload";

export async function GET() {
  const authError = await requireAdminRouteAccess();

  if (authError) {
    return authError;
  }

  const updates = await listPartnerUpdates();
  return NextResponse.json({ updates });
}

export async function POST(request: Request) {
  const authError = await requireAdminRouteAccess();

  if (authError) {
    return authError;
  }

  const session = await getWorkspaceSession();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid update payload." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid update payload." }, { status: 400 });
  }

  const action = (body as { action?: unknown }).action ?? "save_draft";

  if (action !== "save_draft" && action !== "publish") {
    return NextResponse.json({ message: "Unsupported update action." }, { status: 400 });
  }

  const parsed = parseCreatePartnerUpdatePayload(body);

  if ("message" in parsed) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  try {
    const update = await createPartnerUpdate({
      ...parsed.input,
      status: action === "publish" ? "published" : "draft",
      createdByName: session?.fullName ?? "GoAccess Admin",
      createdByEmail: session?.email ?? "maya@goaccess.com",
    });

    return NextResponse.json(
      {
        ok: true,
        update,
        message: action === "publish" ? "Update published." : "Draft saved.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to save the update." },
      { status: 400 }
    );
  }
}
