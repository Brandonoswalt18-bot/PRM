import { get as getBlob } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import { getDealById } from "@/lib/goaccess-store";

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const [{ id }, role, session] = await Promise.all([
    context.params,
    getWorkspaceRole(),
    getWorkspaceSession(),
  ]);

  if (!role || !session) {
    return NextResponse.json({ message: "Portal session required." }, { status: 401 });
  }

  const deal = await getDealById(id);

  if (!deal) {
    return NextResponse.json({ message: "Deal not found." }, { status: 404 });
  }

  if (role === "vendor" && session.vendorId !== deal.vendorId) {
    return NextResponse.json({ message: "You can only access documents for your own deals." }, { status: 403 });
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") === "signed" ? "signed" : "dealer";
  const fileUrl = kind === "signed" ? deal.signedAgreementFileUrl : deal.agreementFileUrl;
  const blobPath = kind === "signed" ? deal.signedAgreementBlobPath : deal.agreementBlobPath;
  const fileName =
    kind === "signed"
      ? deal.signedAgreementFileName ?? "signed-dealer-agreement.pdf"
      : deal.agreementFileName ?? "dealer-agreement.pdf";

  if (!fileUrl) {
    return NextResponse.json({ message: "Agreement file not found." }, { status: 404 });
  }

  if (blobPath) {
    const token = getBlobToken();

    if (!token) {
      return NextResponse.json({ message: "Blob storage token is not configured." }, { status: 500 });
    }

    const result = await getBlob(blobPath, {
      access: "private",
      token,
      useCache: false,
    });

    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ message: "Agreement file not found." }, { status: 404 });
    }

    return new NextResponse(result.stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": result.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  }

  return NextResponse.redirect(new URL(fileUrl, request.url));
}
