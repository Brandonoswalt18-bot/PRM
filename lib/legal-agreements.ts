export const LEGAL_AGREEMENTS = {
  nda: {
    name: "GoAccess Mutual NDA",
    version: "2026-07",
    url: "/legal/goaccess-mutual-nda.pdf",
    sha256: "05e43f5d80e8a93b4da1bafa779640c7e454fe4ca78d3d690c8cafa05aed8a7e",
    acceptanceText:
      "I have read and agree to the GoAccess Mutual Non-Disclosure Agreement and confirm that I am authorized to accept it on behalf of my company.",
  },
  terms: {
    name: "GoAccess Channel Partner Service Agreement",
    version: "2026-07",
    url: "/legal/goaccess-partner-terms.pdf",
    sha256: "c6386ee3e3325ea2aa366055a750f64826eb00fca587fc2b03bd2431176922d1",
    acceptanceText:
      "I have read and agree to the GoAccess Channel Partner Service Agreement and confirm that I am authorized to accept it on behalf of my company.",
  },
} as const;

export type LegalAcceptanceEvidence = {
  acceptedBy: string;
  acceptedTitle: string;
  ipAddress: string;
  userAgent: string;
};

export function getLegalAcceptanceRequestEvidence(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return {
    ipAddress: forwardedFor || request.headers.get("x-real-ip")?.trim() || "unavailable",
    userAgent: request.headers.get("user-agent")?.trim() || "unavailable",
  };
}
