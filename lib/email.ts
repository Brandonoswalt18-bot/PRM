export type VendorEmailPayload = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export type VendorEmailResult = {
  status: "sent" | "logged" | "failed";
  reference?: string;
};

const RESEND_BASE_URL = "https://api.resend.com";
const EMAIL_REQUEST_TIMEOUT_MS = 10_000;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function parseMailbox(value: string | undefined) {
  const normalized = value?.trim() ?? "";
  const bracketedAddress = normalized.match(/^[^<>]*<\s*([^<>]+)\s*>$/)?.[1]?.trim();
  const address = bracketedAddress ?? normalized;

  return EMAIL_PATTERN.test(address) ? address : null;
}

function normalizeRecipients(value: string | string[]) {
  const recipients = (Array.isArray(value) ? value : [value]).map((item) => item.trim());
  const unique = new Map<string, string>();

  for (const recipient of recipients) {
    if (!EMAIL_PATTERN.test(recipient)) {
      return null;
    }

    unique.set(recipient.toLowerCase(), recipient);
  }

  return [...unique.values()];
}

function normalizeIdempotencyKey(value: string | undefined) {
  const normalized = value
    ?.trim()
    .replace(/[^a-zA-Z0-9._:-]+/g, "-")
    .slice(0, 256);

  return normalized || null;
}

function summarizeProviderError(status: number, responseBody: string) {
  let providerMessage = "request rejected";

  try {
    const parsed = JSON.parse(responseBody) as { message?: unknown; name?: unknown };
    const message = typeof parsed.message === "string" ? parsed.message : "";
    const name = typeof parsed.name === "string" ? parsed.name : "";
    providerMessage = message || name || providerMessage;
  } catch {
    providerMessage = responseBody || providerMessage;
  }

  const safeMessage = providerMessage
    .replace(/re_[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);

  return `resend ${status}: ${safeMessage || "request rejected"}`;
}

export function getVendorEmailReadiness() {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.EMAIL_FROM_ADDRESS?.trim() ?? "";
  const fromAddress = parseMailbox(from);
  const fromDomain = fromAddress?.split("@")[1]?.toLowerCase() ?? null;
  const issues: string[] = [];
  const missingEnvVars: string[] = [];

  if (!apiKey) {
    missingEnvVars.push("RESEND_API_KEY");
    issues.push("RESEND_API_KEY is not configured.");
  } else if (!apiKey.startsWith("re_")) {
    issues.push("RESEND_API_KEY does not have the expected Resend key format.");
  }

  if (!from) {
    missingEnvVars.push("EMAIL_FROM_ADDRESS");
    issues.push("EMAIL_FROM_ADDRESS is not configured.");
  } else if (!fromAddress) {
    issues.push("EMAIL_FROM_ADDRESS is not a valid sender mailbox.");
  }

  if (process.env.NODE_ENV === "production" && fromDomain === "resend.dev") {
    issues.push("Production email cannot use Resend's test sending domain.");
  }

  return {
    ready: issues.length === 0,
    configured: Boolean(apiKey || from),
    missingEnvVars,
    fromAddress: from || null,
    fromDomain,
    portalNotifications:
      process.env.GOACCESS_APPLICATION_NOTIFICATION_EMAIL?.trim() || null,
    dealNotifications:
      process.env.GOACCESS_DEAL_NOTIFICATION_EMAIL?.trim() ||
      process.env.GOACCESS_APPLICATION_NOTIFICATION_EMAIL?.trim() ||
      process.env.GOACCESS_ADMIN_EMAIL?.trim() ||
      (process.env.NODE_ENV === "production" ? null : "maya@goaccess.com"),
    issues,
  };
}

export function isVendorEmailEnabled() {
  return getVendorEmailReadiness().ready;
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
    (process.env.NODE_ENV === "production" ? "" : "maya@goaccess.com");

  return [...new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  )];
}

export async function sendVendorEmail(payload: VendorEmailPayload): Promise<VendorEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM_ADDRESS?.trim();
  const recipients = normalizeRecipients(payload.to);
  const readiness = getVendorEmailReadiness();

  if (!recipients || recipients.length === 0) {
    return {
      status: "failed",
      reference: "email recipient configuration is invalid",
    };
  }

  if (!payload.subject.trim()) {
    return {
      status: "failed",
      reference: "email subject is required",
    };
  }

  if (!apiKey || !from) {
    return {
      status: process.env.NODE_ENV === "production" ? "failed" : "logged",
      reference: "email provider not configured",
    };
  }

  if (!readiness.ready) {
    return {
      status: "failed",
      reference: readiness.issues.join(" "),
    };
  }

  const replyTo = payload.replyTo ? parseMailbox(payload.replyTo) : null;

  if (payload.replyTo && !replyTo) {
    return {
      status: "failed",
      reference: "email reply-to configuration is invalid",
    };
  }

  const idempotencyKey = normalizeIdempotencyKey(payload.idempotencyKey);
  let response: Response;

  try {
    response = await fetch(`${RESEND_BASE_URL}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: recipients,
        reply_to: replyTo ?? undefined,
        subject: payload.subject.trim(),
        text: payload.text,
        html: payload.html,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(EMAIL_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      status: "failed",
      reference:
        error instanceof Error && error.name === "TimeoutError"
          ? "resend request timed out"
          : "resend request could not be completed",
    };
  }

  let text: string;

  try {
    text = await response.text();
  } catch {
    return {
      status: "failed",
      reference: "resend response could not be read",
    };
  }

  if (!response.ok) {
    return {
      status: "failed",
      reference: summarizeProviderError(response.status, text),
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
