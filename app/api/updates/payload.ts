import type {
  PartnerUpdateCategory,
  PartnerUpdateContentInput,
  UpdatePartnerUpdateInput,
} from "@/types/goaccess";

const allowedCategories: PartnerUpdateCategory[] = [
  "product_update",
  "sales_resource",
  "operational_notice",
];

const textLimits = {
  title: 160,
  summary: 400,
  body: 20_000,
  resourceLabel: 120,
  resourceUrl: 2_048,
} as const;

type ParseSuccess<T> = { input: T };
type ParseFailure = { message: string };
type ParseResult<T> = ParseSuccess<T> | ParseFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseText(
  value: unknown,
  label: string,
  maximumLength: number,
  required: boolean
) {
  if (typeof value !== "string") {
    return { value: "", message: `${label} must be text.` };
  }

  const normalized = value.trim();

  if (required && !normalized) {
    return { value: "", message: `${label} is required.` };
  }

  if (normalized.length > maximumLength) {
    return {
      value: "",
      message: `${label} must be ${maximumLength.toLocaleString("en-US")} characters or fewer.`,
    };
  }

  return { value: normalized || undefined };
}

function parseResourceUrl(value: unknown) {
  const parsedText = parseText(value, "Resource URL", textLimits.resourceUrl, false);

  if (parsedText.message || !parsedText.value) {
    return parsedText;
  }

  try {
    const url = new URL(parsedText.value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { value: "", message: "Resource URL must use http or https." };
    }
  } catch {
    return { value: "", message: "Enter a valid resource URL." };
  }

  return parsedText;
}

function parseContent(
  raw: unknown,
  requireCoreFields: boolean
): ParseResult<UpdatePartnerUpdateInput> {
  if (!isRecord(raw)) {
    return { message: "Invalid update payload." };
  }

  if ("status" in raw) {
    return { message: "Use a supported update action to change publication status." };
  }

  const input: UpdatePartnerUpdateInput = {};
  const textFields = [
    ["title", "Title", textLimits.title],
    ["summary", "Summary", textLimits.summary],
    ["body", "Update details", textLimits.body],
  ] as const;

  for (const [field, label, maximumLength] of textFields) {
    if (!requireCoreFields && !(field in raw)) {
      continue;
    }

    const parsed = parseText(raw[field], label, maximumLength, true);

    if (parsed.message) {
      return { message: parsed.message };
    }

    input[field] = parsed.value ?? "";
  }

  if (requireCoreFields || "category" in raw) {
    if (
      typeof raw.category !== "string" ||
      !allowedCategories.includes(raw.category as PartnerUpdateCategory)
    ) {
      return { message: "Choose a valid update category." };
    }

    input.category = raw.category as PartnerUpdateCategory;
  }

  if ("resourceLabel" in raw) {
    if (raw.resourceLabel !== null && typeof raw.resourceLabel !== "string") {
      return { message: "Resource label must be text." };
    }

    const parsed = parseText(
      raw.resourceLabel ?? "",
      "Resource label",
      textLimits.resourceLabel,
      false
    );

    if (parsed.message) {
      return { message: parsed.message };
    }

    input.resourceLabel = parsed.value;
  }

  if ("resourceUrl" in raw) {
    if (raw.resourceUrl !== null && typeof raw.resourceUrl !== "string") {
      return { message: "Resource URL must be text." };
    }

    const parsed = parseResourceUrl(raw.resourceUrl ?? "");

    if (parsed.message) {
      return { message: parsed.message };
    }

    input.resourceUrl = parsed.value;
  }

  if ("isPinned" in raw) {
    if (typeof raw.isPinned !== "boolean") {
      return { message: "Pinned status must be true or false." };
    }

    input.isPinned = raw.isPinned;
  } else if (requireCoreFields) {
    input.isPinned = false;
  }

  if (requireCoreFields && input.resourceLabel && !input.resourceUrl) {
    return { message: "Add a resource URL or remove the resource label." };
  }

  return { input };
}

export function parseCreatePartnerUpdatePayload(
  raw: unknown
): ParseResult<PartnerUpdateContentInput> {
  const parsed = parseContent(raw, true);

  if ("message" in parsed) {
    return parsed;
  }

  return { input: parsed.input as PartnerUpdateContentInput };
}

export function parseUpdatePartnerUpdatePayload(
  raw: unknown
): ParseResult<UpdatePartnerUpdateInput> {
  return parseContent(raw, false);
}
