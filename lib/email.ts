type VendorEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

type VendorEmailResult = {
  status: "sent" | "logged" | "failed";
  reference?: string;
};

const RESEND_BASE_URL = "https://api.resend.com";

export function isVendorEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM_ADDRESS);
}

export function getPortalBaseUrl() {
  return process.env.GOACCESS_PORTAL_BASE_URL || "https://prm-site-8tt6tcck5-brandonoswalt18-bots-projects.vercel.app";
}

export function buildInviteUrl(inviteToken: string) {
  return `${getPortalBaseUrl()}/invite/${inviteToken}`;
}

export async function sendVendorEmail(payload: VendorEmailPayload): Promise<VendorEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;

  if (!apiKey || !from) {
    return {
      status: "logged",
      reference: "email provider not configured",
    };
  }

  const response = await fetch(`${RESEND_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
    cache: "no-store",
  });

  const text = await response.text();

  if (!response.ok) {
    return {
      status: "failed",
      reference: `resend ${response.status}: ${text}`,
    };
  }

  let parsed: { id?: string } | null = null;

  try {
    parsed = JSON.parse(text) as { id?: string };
  } catch {
    parsed = null;
  }

  return {
    status: "sent",
    reference: parsed?.id ?? "sent",
  };
}
