import { NextResponse } from "next/server";
import {
  canTransitionSupportRequestStatus,
  listSupportRequests,
  updateSupportRequestStatus,
} from "@/lib/goaccess-store";
import type { SupportRequestStatus } from "@/types/goaccess";

const allowedStatuses: SupportRequestStatus[] = ["open", "in_progress", "resolved"];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let body: { status?: SupportRequestStatus };

  try {
    body = (await request.json()) as { status?: SupportRequestStatus };
  } catch {
    return NextResponse.json({ message: "Invalid support status payload." }, { status: 400 });
  }

  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ message: "Unsupported support request status." }, { status: 400 });
  }

  try {
    const requests = await listSupportRequests();
    const current = requests.find((item) => item.id === id);

    if (!current) {
      return NextResponse.json({ message: "Support request not found." }, { status: 404 });
    }

    if (!canTransitionSupportRequestStatus(current.status, body.status)) {
      return NextResponse.json(
        {
          message: `Cannot move a support request from ${current.status.replaceAll("_", " ")} to ${body.status.replaceAll("_", " ")}.`,
        },
        { status: 409 }
      );
    }

    const supportRequest = await updateSupportRequestStatus(id, body.status);
    return NextResponse.json({ ok: true, supportRequest });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update support request." },
      { status: 400 }
    );
  }
}
