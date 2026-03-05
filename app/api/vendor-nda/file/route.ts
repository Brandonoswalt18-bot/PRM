import { get as getBlob } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import { getVendorById } from "@/lib/goaccess-store";

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

export async function GET(request: Request) {
  const [role, session] = await Promise.all([getWorkspaceRole(), getWorkspaceSession()]);
  const url = new URL(request.url);
  const vendorIdParam = url.searchParams.get("vendorId")?.trim();
  const vendorId =
    vendorIdParam && vendorIdParam.length > 0
      ? vendorIdParam
      : session?.vendorId ?? null;

  if (!vendorId || !role || !session) {
    return NextResponse.json({ message: "Portal session required." }, { status: 401 });
  }

  if (role === "vendor" && session.vendorId !== vendorId) {
    return NextResponse.json({ message: "You can only access your own NDA file." }, { status: 403 });
  }

  const vendor = await getVendorById(vendorId);

  if (!vendor?.signedNdaFileUrl) {
    return NextResponse.json({ message: "Signed NDA file not found." }, { status: 404 });
  }

  if (vendor.signedNdaBlobPath) {
    const token = getBlobToken();

    if (!token) {
      return NextResponse.json({ message: "Blob storage token is not configured." }, { status: 500 });
    }

    const result = await getBlob(vendor.signedNdaBlobPath, {
      access: "private",
      token,
      useCache: false,
    });

    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ message: "Signed NDA file not found." }, { status: 404 });
    }

    return new NextResponse(result.stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": result.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": `inline; filename="${vendor.signedNdaFileName ?? "signed-nda.pdf"}"`,
      },
    });
  }

  return NextResponse.redirect(new URL(vendor.signedNdaFileUrl, request.url));
}
