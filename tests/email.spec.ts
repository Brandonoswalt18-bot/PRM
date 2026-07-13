import { expect, test } from "@playwright/test";
import {
  getDealNotificationRecipients,
  getVendorEmailReadiness,
  sendVendorEmail,
} from "@/lib/email";

const originalFetch = globalThis.fetch;
const originalEnvironment = {
  nodeEnv: process.env.NODE_ENV,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS,
  dealNotificationEmail: process.env.GOACCESS_DEAL_NOTIFICATION_EMAIL,
  applicationNotificationEmail: process.env.GOACCESS_APPLICATION_NOTIFICATION_EMAIL,
  adminEmail: process.env.GOACCESS_ADMIN_EMAIL,
};

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreEnvironmentVariable("NODE_ENV", originalEnvironment.nodeEnv);
  restoreEnvironmentVariable("RESEND_API_KEY", originalEnvironment.resendApiKey);
  restoreEnvironmentVariable("EMAIL_FROM_ADDRESS", originalEnvironment.emailFromAddress);
  restoreEnvironmentVariable(
    "GOACCESS_DEAL_NOTIFICATION_EMAIL",
    originalEnvironment.dealNotificationEmail,
  );
  restoreEnvironmentVariable(
    "GOACCESS_APPLICATION_NOTIFICATION_EMAIL",
    originalEnvironment.applicationNotificationEmail,
  );
  restoreEnvironmentVariable("GOACCESS_ADMIN_EMAIL", originalEnvironment.adminEmail);
});

test("missing email configuration logs locally but fails closed in production", async () => {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM_ADDRESS;

  restoreEnvironmentVariable("NODE_ENV", "development");
  const localResult = await sendVendorEmail({
    to: "vendor@example.com",
    subject: "Local workflow",
    text: "Local workflow",
    html: "<p>Local workflow</p>",
  });
  expect(localResult).toMatchObject({ status: "logged" });

  restoreEnvironmentVariable("NODE_ENV", "production");
  const productionResult = await sendVendorEmail({
    to: "vendor@example.com",
    subject: "Production workflow",
    text: "Production workflow",
    html: "<p>Production workflow</p>",
  });
  expect(productionResult).toMatchObject({ status: "failed" });
});

test("production refuses Resend's test domain without making a request", async () => {
  restoreEnvironmentVariable("NODE_ENV", "production");
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.EMAIL_FROM_ADDRESS = "GoAccess <onboarding@resend.dev>";
  let requestCount = 0;
  globalThis.fetch = async () => {
    requestCount += 1;
    return new Response(JSON.stringify({ id: "should-not-send" }));
  };

  const readiness = getVendorEmailReadiness();
  const result = await sendVendorEmail({
    to: "vendor@example.com",
    subject: "Blocked production workflow",
    text: "Blocked production workflow",
    html: "<p>Blocked production workflow</p>",
  });

  expect(readiness.ready).toBe(false);
  expect(readiness.fromDomain).toBe("resend.dev");
  expect(result).toMatchObject({ status: "failed" });
  expect(requestCount).toBe(0);
});

test("deal alerts have no hardcoded production recipient fallback", () => {
  delete process.env.GOACCESS_DEAL_NOTIFICATION_EMAIL;
  delete process.env.GOACCESS_APPLICATION_NOTIFICATION_EMAIL;
  delete process.env.GOACCESS_ADMIN_EMAIL;

  restoreEnvironmentVariable("NODE_ENV", "production");
  expect(getDealNotificationRecipients()).toEqual([]);

  restoreEnvironmentVariable("NODE_ENV", "development");
  expect(getDealNotificationRecipients()).toEqual(["maya@goaccess.com"]);
});

test("configured delivery deduplicates recipients and sends an idempotency key", async () => {
  restoreEnvironmentVariable("NODE_ENV", "production");
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.EMAIL_FROM_ADDRESS = "GoAccess <vendors@goaccess.com>";
  let request: { headers: Headers; body: Record<string, unknown> } | null = null;
  globalThis.fetch = async (_input, init) => {
    request = {
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    };
    return new Response(JSON.stringify({ id: "email_test_123" }), { status: 200 });
  };

  const result = await sendVendorEmail({
    to: ["Vendor@example.com", "vendor@example.com"],
    replyTo: "support@goaccess.com",
    subject: "Decision update",
    text: "Decision update",
    html: "<p>Decision update</p>",
    idempotencyKey: "deal 123 / approval",
  });

  expect(result).toEqual({ status: "sent", reference: "email_test_123" });
  expect(request).not.toBeNull();
  expect(request!.headers.get("Idempotency-Key")).toBe("deal-123-approval");
  expect(request!.body).toMatchObject({
    from: "GoAccess <vendors@goaccess.com>",
    to: ["vendor@example.com"],
    reply_to: "support@goaccess.com",
  });
});

test("provider and network failures return safe failed results", async () => {
  restoreEnvironmentVariable("NODE_ENV", "production");
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.EMAIL_FROM_ADDRESS = "GoAccess <vendors@goaccess.com>";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ message: "Sender rejected for re_sensitive_value_that_must_not_be_logged" }),
      { status: 422 },
    );

  const rejected = await sendVendorEmail({
    to: "vendor@example.com",
    subject: "Rejected workflow",
    text: "Rejected workflow",
    html: "<p>Rejected workflow</p>",
  });
  expect(rejected.status).toBe("failed");
  expect(rejected.reference).toContain("resend 422");
  expect(rejected.reference).not.toContain("re_sensitive");

  globalThis.fetch = async () => {
    throw new TypeError("network unavailable");
  };
  const unavailable = await sendVendorEmail({
    to: "vendor@example.com",
    subject: "Unavailable workflow",
    text: "Unavailable workflow",
    html: "<p>Unavailable workflow</p>",
  });
  expect(unavailable).toEqual({
    status: "failed",
    reference: "resend request could not be completed",
  });
});
