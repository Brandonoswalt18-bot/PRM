import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { LEGAL_AGREEMENTS } from "@/lib/legal-agreements";
import type { ApprovedVendor } from "@/types/goaccess";

export type LegalAgreementKind = "nda" | "terms";

const legalTimeZone = "America/Los_Angeles";
const ink = rgb(0.075, 0.137, 0.247);
const blue = rgb(0.02, 0.31, 0.69);
const muted = rgb(0.34, 0.4, 0.5);
const white = rgb(1, 1, 1);

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

function drawLineField(
  page: PDFPage,
  font: PDFFont,
  value: string,
  options: { x: number; y: number; width: number; size?: number }
) {
  const text = cleanPdfText(value);

  if (!text) {
    return;
  }

  const size = fitFontSize(font, text, options.width, options.size ?? 9);
  page.drawRectangle({
    x: options.x - 1,
    y: options.y - 1,
    width: options.width + 2,
    height: size + 5,
    color: white,
  });
  page.drawLine({
    start: { x: options.x, y: options.y },
    end: { x: options.x + options.width, y: options.y },
    thickness: 0.6,
    color: ink,
  });
  page.drawText(text, {
    x: options.x + 2,
    y: options.y + 2.2,
    size,
    font,
    color: ink,
  });
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

async function loadTemplate(kind: LegalAgreementKind) {
  const templatePath = path.join(
    process.cwd(),
    "public",
    "legal",
    kind === "nda" ? "goaccess-non-disclosure-agreement.pdf" : "goaccess-partner-terms.pdf"
  );
  return readFile(templatePath);
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

  const agreement = kind === "nda" ? LEGAL_AGREEMENTS.nda : LEGAL_AGREEMENTS.terms;
  const pdf = await PDFDocument.load(await loadTemplate(kind));
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
