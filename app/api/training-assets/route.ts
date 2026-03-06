import { NextResponse } from "next/server";
import { getWorkspaceSession } from "@/lib/auth";
import { requireAdminRouteAccess } from "@/lib/auth-guards";
import { createExternalTrainingAsset, uploadTrainingAssetFile } from "@/lib/goaccess-store";
import type { TrainingAssetType } from "@/types/goaccess";

const allowedTypes: TrainingAssetType[] = ["video", "document"];

export async function POST(request: Request) {
  const authError = await requireAdminRouteAccess();

  if (authError) {
    return authError;
  }

  const session = await getWorkspaceSession();
  const uploadedBy = session?.email ?? "maya@goaccess.com";

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

    return NextResponse.json({ ok: true, asset, message: "Training file uploaded." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to upload training file." },
      { status: 400 }
    );
  }
}
