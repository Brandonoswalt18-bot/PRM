import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "email.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
});
