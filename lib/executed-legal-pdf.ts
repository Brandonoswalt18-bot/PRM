import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import {
  HISTORICAL_PARTNER_AGREEMENTS,
  LEGAL_AGREEMENTS,
} from "@/lib/legal-agreements";
import type { ApprovedVendor } from "@/types/goaccess";

export type LegalAgreementKind = "nda" | "terms";

const legalTimeZone = "America/Los_Angeles";
const ink = rgb(0.075, 0.137, 0.247);
const blue = rgb(0.02, 0.31, 0.69);
const muted = rgb(0.34, 0.4, 0.5);
const white = rgb(1, 1, 1);

type LineField = {
  value: string;
  x: number;
  y: number;
  width: number;
  size?: number;
  clearHeight?: number;
};

type PartnerAgreementTemplate = {
  name: string;
  version: string;
  url: string;
  sha256: string;
  acceptanceText: string;
  layout: "channel-service-2026-07" | "partner-reseller-2026-07.1";
};

function cleanPdfText(value: string | undefined, fallback = "") {
  return (value ?? fallback).replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function fitFontSize(font: PDFFont, value: string, maxWidth: number, preferredSize = 9) {
  let size = preferredSize;

  while (size > 6 && font.widthOfTextAtSize(value, size) > maxWidth) {
    size -= 0.25;
  }

  return size;
}

function drawLineFields(page: PDFPage, font: PDFFont, fields: LineField[]) {
  const prepared = fields
    .map((field) => {
      const text = cleanPdfText(field.value);
      return text
        ? { ...field, text, fittedSize: fitFontSize(font, text, field.width, field.size ?? 9) }
        : null;
    })
    .filter((field): field is LineField & { text: string; fittedSize: number } => Boolean(field));

  // Clear every target before drawing any value. The first-page reseller fields
  // are intentionally close together, so clearing them in a separate pass keeps
  // one field from erasing another field's completed text.
  for (const field of prepared) {
    page.drawRectangle({
      x: field.x - 1,
      y: field.y - 1,
      width: field.width + 2,
      height: field.clearHeight ?? field.fittedSize + 5,
      color: white,
    });
  }

  for (const field of prepared) {
    page.drawLine({
      start: { x: field.x, y: field.y },
      end: { x: field.x + field.width, y: field.y },
      thickness: 0.6,
      color: ink,
    });
    page.drawText(field.text, {
      x: field.x + 2,
      y: field.y + 2.2,
      size: field.fittedSize,
      font,
      color: ink,
    });
  }
}

function drawLineField(
  page: PDFPage,
  font: PDFFont,
  value: string,
  options: Omit<LineField, "value">
) {
  drawLineFields(page, font, [{ value, ...options }]);
}

function getDateParts(isoTimestamp: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: legalTimeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(new Date(isoTimestamp));

  return {
    day: parts.find((part) => part.type === "day")?.value ?? "",
    month: parts.find((part) => part.type === "month")?.value ?? "",
    year: parts.find((part) => part.type === "year")?.value ?? "",
  };
}

function formatAcceptanceDate(isoTimestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: legalTimeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoTimestamp));
}

function formatAcceptanceTimestamp(isoTimestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: legalTimeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(isoTimestamp));
}

function wrapText(font: PDFFont, text: string, size: number, maxWidth: number) {
  const words = cleanPdfText(text).split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (!current || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function addAcceptanceReceipt(
  pdf: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  details: {
    agreementName: string;
    version: string;
    templateHash: string;
    companyName: string;
    acceptedBy: string;
    acceptedTitle: string;
    acceptedAt: string;
    acceptanceText: string;
  }
) {
  const page = pdf.addPage([612, 792]);
  const left = 58;
  const width = 496;

  page.drawRectangle({ x: 32, y: 32, width: 548, height: 728, borderColor: blue, borderWidth: 1 });
  page.drawText("GOACCESS", { x: left, y: 708, size: 13, font: bold, color: blue });
  page.drawText("Electronic Acceptance Record", { x: left, y: 662, size: 24, font: bold, color: ink });
  page.drawText("This page is part of the accepted agreement copy.", {
    x: left,
    y: 638,
    size: 10,
    font,
    color: muted,
  });

  const rows = [
    ["Agreement", details.agreementName],
    ["Company", details.companyName],
    ["Accepted by", details.acceptedBy],
    ["Title", details.acceptedTitle],
    ["Accepted on", formatAcceptanceTimestamp(details.acceptedAt)],
    ["Version", details.version],
    ["Template SHA-256", details.templateHash],
  ];
  let y = 592;

  for (const [label, value] of rows) {
    page.drawText(label, { x: left, y, size: 8, font: bold, color: blue });
    const valueSize = fitFontSize(font, value, width - 120, 10);
    page.drawText(value, { x: left + 120, y: y - 1, size: valueSize, font, color: ink });
    page.drawLine({
      start: { x: left, y: y - 10 },
      end: { x: left + width, y: y - 10 },
      thickness: 0.35,
      color: rgb(0.82, 0.86, 0.92),
    });
    y -= 42;
  }

  page.drawText("Acceptance statement", { x: left, y: 280, size: 8, font: bold, color: blue });
  const statementLines = wrapText(font, details.acceptanceText, 10, width);
  statementLines.forEach((line, index) => {
    page.drawText(line, { x: left, y: 258 - index * 15, size: 10, font, color: ink });
  });

  page.drawText(`/s/ ${details.acceptedBy}`, { x: left, y: 162, size: 14, font, color: ink });
  page.drawLine({
    start: { x: left, y: 154 },
    end: { x: left + 250, y: 154 },
    thickness: 0.7,
    color: ink,
  });
  page.drawText("Electronic signature", { x: left, y: 138, size: 8, font, color: muted });
  page.drawText(
    `Generated from the GoAccess vendor portal acceptance audit trail on ${formatAcceptanceTimestamp(details.acceptedAt)}.`,
    { x: left, y: 72, size: 7.5, font, color: muted }
  );
}

function resolvePartnerAgreementTemplate(vendor: ApprovedVendor): PartnerAgreementTemplate {
  const current = {
    ...LEGAL_AGREEMENTS.terms,
    layout: "partner-reseller-2026-07.1" as const,
  };
  const historical = {
    ...HISTORICAL_PARTNER_AGREEMENTS.channelPartnerService202607,
    layout: "channel-service-2026-07" as const,
  };

  if (vendor.termsDocumentSha256) {
    if (vendor.termsDocumentSha256 === current.sha256) {
      return current;
    }

    if (vendor.termsDocumentSha256 === historical.sha256) {
      return historical;
    }

    throw new Error("The accepted Partner Agreement template is not available for this audit record.");
  }

  if (vendor.termsVersion === current.version) {
    return current;
  }

  if (!vendor.termsVersion || [historical.version, "legacy-prelaunch"].includes(vendor.termsVersion)) {
    return historical;
  }

  throw new Error("The accepted Partner Agreement version is not available for this audit record.");
}

async function loadTemplate(kind: LegalAgreementKind, vendor: ApprovedVendor) {
  const partnerAgreement = kind === "terms" ? resolvePartnerAgreementTemplate(vendor) : null;
  const documentUrl =
    kind === "nda" ? LEGAL_AGREEMENTS.nda.url : partnerAgreement!.url;
  const templatePath = path.join(
    process.cwd(),
    "public",
    ...documentUrl.split("/").filter(Boolean)
  );
  return {
    bytes: await readFile(templatePath),
    partnerAgreement,
  };
}

export async function buildExecutedLegalAgreementPdf(
  kind: LegalAgreementKind,
  vendor: ApprovedVendor
) {
  const acceptedAt = kind === "nda" ? vendor.ndaSignedAt : vendor.termsAcceptedAt;
  const acceptedBy = cleanPdfText(
    kind === "nda" ? vendor.ndaAcceptedBy : vendor.termsAcceptedBy,
    vendor.primaryContactName
  );
  const acceptedTitle = cleanPdfText(
    kind === "nda" ? vendor.ndaAcceptedTitle : vendor.termsAcceptedTitle,
    "Title not recorded"
  );

  if (!acceptedAt) {
    throw new Error("This agreement has not been accepted yet.");
  }

  const template = await loadTemplate(kind, vendor);
  const agreement = kind === "nda" ? LEGAL_AGREEMENTS.nda : template.partnerAgreement!;
  const pdf = await PDFDocument.load(template.bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  const signature = `/s/ ${acceptedBy}`;
  const acceptedDate = formatAcceptanceDate(acceptedAt);

  if (kind === "nda") {
    const date = getDateParts(acceptedAt);
    drawLineField(pages[0], font, date.day, { x: 216, y: 636, width: 16, size: 9 });
    drawLineField(pages[0], font, date.month, { x: 260, y: 636, width: 62, size: 9 });
    drawLineField(pages[0], font, `${date.year},`, { x: 324, y: 636, width: 22, size: 9 });
    drawLineField(pages[0], font, vendor.companyName, { x: 58, y: 622, width: 262, size: 9 });

    drawLineField(pages[1], font, vendor.companyName, { x: 58, y: 594, width: 194, size: 9 });
    drawLineField(pages[1], font, signature, { x: 77, y: 570, width: 235, size: 9 });
    drawLineField(pages[1], font, acceptedBy, { x: 88, y: 556, width: 234, size: 9 });
    drawLineField(pages[1], font, acceptedTitle, { x: 92, y: 542, width: 135, size: 9 });
    drawLineField(pages[1], font, acceptedDate, { x: 88, y: 528, width: 134, size: 9 });
  } else if (template.partnerAgreement!.layout === "partner-reseller-2026-07.1") {
    const location = [vendor.city, vendor.state].filter(Boolean).join(", ");
    drawLineFields(pages[0], font, [
      { value: vendor.companyName, x: 72, y: 588, width: 359, size: 9 },
      { value: location, x: 152, y: 576, width: 360, size: 9 },
    ]);
    drawLineField(pages[6], font, vendor.companyName, { x: 127, y: 627, width: 261.5, size: 9 });
    drawLineField(pages[6], font, `${acceptedBy}, ${acceptedTitle}`, { x: 72, y: 596, width: 200, size: 8.5 });
    drawLineField(pages[6], font, acceptedDate, { x: 286, y: 596, width: 92, size: 8.5 });
    drawLineField(pages[6], font, signature, { x: 72, y: 553, width: 153, size: 8.5 });
  } else {
    drawLineField(pages[0], font, vendor.companyName, { x: 72, y: 570, width: 294, size: 9 });

    const location = [vendor.city, vendor.state].filter(Boolean).join(", ");
    if (location) {
      drawLineField(pages[0], font, location, { x: 72, y: 556, width: 294, size: 9 });
    }

    drawLineField(pages[5], font, vendor.companyName, { x: 168, y: 304, width: 218, size: 9 });
    drawLineField(pages[5], font, `${acceptedBy}, ${acceptedTitle}`, { x: 72, y: 276, width: 180, size: 8.5 });
    drawLineField(pages[5], font, acceptedDate, { x: 281, y: 276, width: 126, size: 8.5 });
    drawLineField(pages[5], font, signature, { x: 72, y: 234, width: 180, size: 8.5 });
  }

  addAcceptanceReceipt(pdf, font, bold, {
    agreementName: agreement.name,
    version: kind === "nda" ? vendor.ndaVersion ?? agreement.version : vendor.termsVersion ?? agreement.version,
    templateHash:
      kind === "nda"
        ? vendor.ndaDocumentSha256 ?? agreement.sha256
        : vendor.termsDocumentSha256 ?? agreement.sha256,
    companyName: cleanPdfText(vendor.companyName),
    acceptedBy,
    acceptedTitle,
    acceptedAt,
    acceptanceText:
      kind === "nda"
        ? vendor.ndaAcceptanceText ?? agreement.acceptanceText
        : vendor.termsAcceptanceText ?? agreement.acceptanceText,
  });

  pdf.setTitle(`${agreement.name} - Accepted - ${cleanPdfText(vendor.companyName)}`);
  pdf.setSubject(`Electronically accepted on ${formatAcceptanceTimestamp(acceptedAt)}`);
  pdf.setAuthor("GoAccess LLC");
  pdf.setProducer("GoAccess Vendor Portal");
  pdf.setCreator("GoAccess Vendor Portal");

  return pdf.save();
}

export function getExecutedLegalAgreementFileName(kind: LegalAgreementKind, companyName: string) {
  const companySlug = cleanPdfText(companyName, "vendor")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "vendor";
  return `goaccess-${kind === "nda" ? "nda" : "partner-agreement"}-${companySlug}-accepted.pdf`;
}
