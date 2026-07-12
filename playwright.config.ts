import { defineConfig, devices } from "@playwright/test";

const port = 3100;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm dev --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_SECRET: "goaccess-e2e-auth-secret",
      GOACCESS_ADMIN_EMAIL: "maya@goaccess.com",
      GOACCESS_ADMIN_PASSWORD: "goaccess-admin-demo",
      GOACCESS_STORE_PATH: ".tmp/playwright-store.json",
      GOACCESS_PORTAL_BASE_URL: `http://127.0.0.1:${port}`,
      GOACCESS_NDA_DOCUMENT_URL:
        "https://docs.google.com/document/d/17mAo8aotjxbz7tT-Xs0SGI1614IdmgEp/edit",
      GOACCESS_TERMS_DOCUMENT_URL:
        "https://docs.google.com/document/d/1--W8AKJPwh6L2CzSi-eTxYycSUUdNP7pAakEDFfIbgQ/edit?tab=t.0",
      GOACCESS_TERMS_VERSION: "2026-07",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      BLOB_READ_WRITE_TOKEN: "",
      RESEND_API_KEY: "",
      HUBSPOT_ACCESS_TOKEN: "",
    },
  },
});
