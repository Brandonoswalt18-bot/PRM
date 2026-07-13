import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "hubspot-mapping.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
});
