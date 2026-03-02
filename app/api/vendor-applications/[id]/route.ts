import { NextResponse } from "next/server";
import {
  canTransitionApplicationStatus,
  listVendorApplications,
  updateVendorApplicationStatus,
} from "@/lib/goaccess-store";
import type { VendorApplicationStatus } from "@/types/goaccess";

const allowedStatuses: VendorApplicationStatus[] = [
  "under_review",
  "approved",
  "rejected",
  "nda_sent",
  "nda_signed",
  "credentials_issued",
];

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let body: { status?: VendorApplicationStatus };

  try {
    body = (await request.json()) as { status?: VendorApplicationStatus };
  } catch {
    return NextResponse.json({ message: "Invalid status payload." }, { status: 400 });
  }

  if (!body.status || !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ message: "Unsupported application status." }, { status: 400 });
  }

  try {
    const applications = await listVendorApplications();
    const current = applications.find((item) => item.id === id);

    if (!current) {
      return NextResponse.json({ message: "Application not found." }, { status: 404 });
    }

    if (!canTransitionApplicationStatus(current.status, body.status)) {
      return NextResponse.json(
        { message: `Cannot move an application from ${current.status.replaceAll("_", " ")} to ${body.status.replaceAll("_", " ")}.` },
        { status: 409 }
      );
    }

    const application = await updateVendorApplicationStatus(id, body.status);
    return NextResponse.json({ ok: true, application });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update application." },
      { status: 404 }
    );
  }
}
