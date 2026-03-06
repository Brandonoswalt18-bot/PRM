import { get as getBlob } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getWorkspaceRole, getWorkspaceSession } from "@/lib/auth";
import { getTrainingAssetById } from "@/lib/goaccess-store";

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

export async function GET(request: Request) {
  const [role, session] = await Promise.all([getWorkspaceRole(), getWorkspaceSession()]);
  const url = new URL(request.url);
  const assetId = url.searchParams.get("id")?.trim();

  if (!assetId || !role || !session) {
    return NextResponse.json({ message: "Portal session required." }, { status: 401 });
  }

  const asset = await getTrainingAssetById(assetId);

  if (!asset) {
    return NextResponse.json({ message: "Training file not found." }, { status: 404 });
  }

  if (asset.source === "external" && asset.externalUrl) {
    return NextResponse.redirect(asset.externalUrl);
  }

  if (!asset.fileUrl) {
    return NextResponse.json({ message: "Training file not found." }, { status: 404 });
  }

  if (asset.blobPath) {
    const token = getBlobToken();

    if (!token) {
      return NextResponse.json({ message: "Blob storage token is not configured." }, { status: 500 });
    }

    const result = await getBlob(asset.blobPath, {
      access: "private",
      token,
      useCache: false,
    });

    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ message: "Training file not found." }, { status: 404 });
    }

    return new NextResponse(result.stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": result.headers.get("content-type") || asset.contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${asset.fileName ?? "training-file"}"`,
      },
    });
  }

  return NextResponse.redirect(new URL(asset.fileUrl, request.url));
}
