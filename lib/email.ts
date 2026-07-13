type VendorEmailPayload = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
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
  const configuredUrl = process.env.GOACCESS_PORTAL_BASE_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return process.env.NODE_ENV === "production" ? "https://goaccess.com" : "http://localhost:3000";
}

export function buildInviteUrl(inviteToken: string) {
  return `${getPortalBaseUrl()}/invite/${inviteToken}`;
}

export function buildOnboardingUrl(inviteToken: string) {
  return `${getPortalBaseUrl()}/onboarding/${inviteToken}`;
}

export function getApplicationNotificationRecipients() {
  const raw = process.env.GOACCESS_APPLICATION_NOTIFICATION_EMAIL ?? "";

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getDealNotificationRecipients() {
  const raw =
    process.env.GOACCESS_DEAL_NOTIFICATION_EMAIL ??
    process.env.GOACCESS_APPLICATION_NOTIFICATION_EMAIL ??
    process.env.GOACCESS_ADMIN_EMAIL ??
    "maya@goaccess.com";

  return [...new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  )];
}

export async function sendVendorEmail(payload: VendorEmailPayload): Promise<VendorEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM_ADDRESS;
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  if (!apiKey || !from || recipients.length === 0) {
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
      to: recipients,
      reply_to: payload.replyTo,
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
