import { NextResponse } from "next/server";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import {
  getPartnerUpdateById,
  updatePartnerUpdate,
} from "@/lib/goaccess-store";
import { parseUpdatePartnerUpdatePayload } from "../payload";

type UpdateAction = "save" | "publish" | "archive";

const allowedActions: UpdateAction[] = ["save", "publish", "archive"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminRouteAccess();

  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid update payload." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ message: "Invalid update payload." }, { status: 400 });
  }

  const rawAction = (body as { action?: unknown }).action ?? "save";

  if (typeof rawAction !== "string" || !allowedActions.includes(rawAction as UpdateAction)) {
    return NextResponse.json({ message: "Unsupported update action." }, { status: 400 });
  }

  const action = rawAction as UpdateAction;
  const current = await getPartnerUpdateById(id);

  if (!current) {
    return NextResponse.json({ message: "Partner update not found." }, { status: 404 });
  }

  if (current.status === "archived" && action === "save") {
    return NextResponse.json(
      { message: "Archived updates must be republished before they can be edited." },
      { status: 409 }
    );
  }

  const parsed = parseUpdatePartnerUpdatePayload(body);

  if ("message" in parsed) {
    return NextResponse.json({ message: parsed.message }, { status: 400 });
  }

  try {
    const update = await updatePartnerUpdate(id, {
      ...parsed.input,
      status:
        action === "publish"
          ? "published"
          : action === "archive"
            ? "archived"
            : undefined,
    });

    return NextResponse.json({
      ok: true,
      update,
      message:
        action === "publish"
          ? "Update published."
          : action === "archive"
            ? "Update archived."
            : "Update saved.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update the announcement." },
      { status: 400 }
    );
  }
}
