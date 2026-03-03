import { NextResponse } from "next/server";
import { getWorkspaceSession } from "@/lib/auth";
import { listSupportRequests, submitSupportRequest } from "@/lib/goaccess-store";
import type { SupportRequestCategory } from "@/types/goaccess";

type SupportPayload = {
  subject?: string;
  category?: SupportRequestCategory;
  message?: string;
};

const allowedCategories: SupportRequestCategory[] = [
  "deal_registration",
  "hubspot_sync",
  "profile_update",
  "rmr_question",
  "portal_access",
  "general",
];

export async function GET() {
  const session = await getWorkspaceSession();
  const requests = await listSupportRequests(session?.vendorId);
  return NextResponse.json({ items: requests });
}

export async function POST(request: Request) {
  const session = await getWorkspaceSession();

  if (!session?.vendorId) {
    return NextResponse.json({ message: "Approved vendor session required." }, { status: 401 });
  }

  let body: SupportPayload;

  try {
    body = (await request.json()) as SupportPayload;
  } catch {
    return NextResponse.json({ message: "Invalid support request payload." }, { status: 400 });
  }

  const subject = body.subject?.trim() ?? "";
  const category = body.category ?? "general";
  const message = body.message?.trim() ?? "";

  if (!subject || !message) {
    return NextResponse.json(
      { message: "Subject and support details are required." },
      { status: 400 }
    );
  }

  if (!allowedCategories.includes(category)) {
    return NextResponse.json({ message: "Unsupported support category." }, { status: 400 });
  }

  try {
    const supportRequest = await submitSupportRequest(session.vendorId, {
      subject,
      category,
      message,
    });

    return NextResponse.json({
      ok: true,
      supportRequest,
      message: "Support request submitted to the GoAccess team.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to submit support request." },
      { status: 400 }
    );
  }
}
