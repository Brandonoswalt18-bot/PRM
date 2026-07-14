export const LEGAL_AGREEMENTS = {
  nda: {
    name: "GoAccess Non-Disclosure Agreement",
    version: "2026-07.1",
    url: "/legal/goaccess-non-disclosure-agreement.pdf",
    sha256: "28a206cc072f9c2eff9494c537c63f3a335fe74e564093d18f3f37c56af0f2b5",
    acceptanceText:
      "I have read and agree to the GoAccess Non-Disclosure Agreement and confirm that I am authorized to accept it on behalf of my company.",
  },
  terms: {
    name: "GoAccess Partner Reseller Agreement",
    version: "2026-07.1",
    url: "/legal/goaccess-partner-terms.pdf",
    sha256: "6623fb6c81c0e4ad26ccdb8c96b2b26cb7df56a846d6a66657078fb5870d6e94",
    acceptanceText:
      "I have read and agree to the GoAccess Partner Reseller Agreement and confirm that I am authorized to accept it on behalf of my company.",
  },
} as const;

export const HISTORICAL_PARTNER_AGREEMENTS = {
  channelPartnerService202607: {
    name: "GoAccess Channel Partner Service Agreement",
    version: "2026-07",
    url: "/legal/archive/goaccess-partner-terms-2026-07.pdf",
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
