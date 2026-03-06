import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getWorkspaceSession } from "@/lib/auth";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import {
  createExternalTrainingAsset,
  finalizeTrainingUpload,
  uploadTrainingAssetFile,
} from "@/lib/goaccess-store";
import type { TrainingAssetType } from "@/types/goaccess";

const allowedTypes: TrainingAssetType[] = ["video", "document"];
const trainingVideoMaxBytes = 1024 * 1024 * 1024;
const trainingDocumentMaxBytes = 25 * 1024 * 1024;
const allowedVideoContentTypes = ["video/*"];
const allowedDocumentContentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
];

export async function POST(request: Request) {
  const authError = await requireAdminRouteAccess();

  if (authError) {
    return authError;
  }

  const session = await getWorkspaceSession();
  const uploadedBy = session?.email ?? "maya@goaccess.com";

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload ?? "{}") as {
          title?: string;
          description?: string;
          type?: TrainingAssetType;
          fileName?: string;
          contentType?: string;
          uploadedBy?: string;
        };

        if (!payload.title?.trim() || !payload.fileName?.trim() || !allowedTypes.includes(payload.type ?? "video")) {
          throw new Error("Training upload metadata is invalid.");
        }

        const assetType = payload.type as TrainingAssetType;

        return {
          addRandomSuffix: false,
          allowOverwrite: true,
          maximumSizeInBytes: assetType === "video" ? trainingVideoMaxBytes : trainingDocumentMaxBytes,
          allowedContentTypes:
            assetType === "video" ? allowedVideoContentTypes : allowedDocumentContentTypes,
          tokenPayload: JSON.stringify({
            title: payload.title.trim(),
            description: payload.description?.trim() ?? "",
            type: assetType,
            fileName: payload.fileName.trim(),
            contentType: payload.contentType?.trim() || "application/octet-stream",
            uploadedBy: payload.uploadedBy?.trim() || uploadedBy,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload ?? "{}") as {
          title?: string;
          description?: string;
          type?: TrainingAssetType;
          fileName?: string;
          contentType?: string;
          uploadedBy?: string;
        };

        if (!payload.title?.trim() || !payload.fileName?.trim() || !allowedTypes.includes(payload.type ?? "video")) {
          return;
        }

        await finalizeTrainingUpload({
          title: payload.title.trim(),
          description: payload.description?.trim() ?? "",
          type: payload.type as TrainingAssetType,
          fileName: payload.fileName.trim(),
          contentType: payload.contentType?.trim() || blob.contentType || "application/octet-stream",
          blobPath: blob.pathname,
          uploadedBy: payload.uploadedBy?.trim() || uploadedBy,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim() as TrainingAssetType;
  const source = String(formData.get("source") ?? "").trim();
  const externalUrl = String(formData.get("externalUrl") ?? "").trim();
  const file = formData.get("file");

  if (!title || !allowedTypes.includes(type)) {
    return NextResponse.json({ message: "Title and valid training type are required." }, { status: 400 });
  }

  if (source === "external") {
    if (!externalUrl.startsWith("http://") && !externalUrl.startsWith("https://")) {
      return NextResponse.json({ message: "Enter a valid external video or document URL." }, { status: 400 });
    }

    const asset = await createExternalTrainingAsset({
      title,
      description,
      type,
      externalUrl,
      uploadedBy,
    });

    return NextResponse.json({ ok: true, asset, message: "Training link added." });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Choose a training file to upload." }, { status: 400 });
  }

  if (type === "document") {
    try {
      const asset = await uploadTrainingAssetFile({
        title,
        description,
        type,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        bytes: new Uint8Array(await file.arrayBuffer()),
        uploadedBy,
      });

      return NextResponse.json({ ok: true, asset, message: "Training document uploaded." });
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : "Unable to upload training document." },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    {
      message: "Video uploads use direct blob upload. If this stalls, use an external video link instead.",
      fileName: file.name,
    },
    { status: 400 }
  );
}
