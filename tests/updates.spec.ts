import { expect, test, type Page } from "@playwright/test";
import type { ClientPartnerUpdate, PartnerUpdate } from "../types/goaccess";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/Email address/).fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function signOut(page: Page) {
  await page.goto("/auth/logout");
}

test("updates stay admin-controlled, publish safely, and remain usable on mobile", async ({
  page,
  request,
}) => {
  const unique = Date.now();
  const firstTitle = `Security update ${unique}`;
  const secondTitle = `Pinned product update ${unique}`;
  const resourceUrl = `https://docs.example.com/update-${unique}`;
  const unsafeMarkup = `<img src="x" onerror="window.__updatesXss = true"> ${unique}`;

  // Anonymous visitors cannot read the admin collection, mutate it, or read the vendor feed.
  expect((await request.get("/api/updates")).status()).toBe(401);
  expect(
    (
      await request.post("/api/updates", {
        data: {
          title: firstTitle,
          summary: "Anonymous mutation attempt",
          body: "This must not be created.",
          category: "operational_notice",
          action: "save_draft",
        },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.patch("/api/updates/not-a-real-update", {
        data: { action: "publish" },
      })
    ).status(),
  ).toBe(401);
  expect((await request.get("/api/vendor-updates")).status()).toBe(401);

  await signIn(page, "Alex", "12345678");
  await expect(page).toHaveURL(/\/portal\/onboarding$/);
  expect((await page.request.get("/api/vendor-updates")).status()).toBe(403);
  await page.goto("/portal/updates");
  await expect(page).toHaveURL(/\/portal\/onboarding/);

  await signOut(page);
  await signIn(page, "jordan@bluehavenintegrators.com", "goaccess-vendor-demo");
  await expect(page).toHaveURL(/\/portal$/);

  // A vendor can read the published-only feed but cannot use any admin endpoint.
  expect((await page.request.get("/api/vendor-updates")).ok()).toBeTruthy();
  expect((await page.request.get("/api/updates")).status()).toBe(401);
  expect(
    (
      await page.request.post("/api/updates", {
        data: {
          title: firstTitle,
          summary: "Vendor mutation attempt",
          body: "This must not be created.",
          category: "operational_notice",
          action: "save_draft",
        },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.patch("/api/updates/not-a-real-update", {
        data: { action: "archive" },
      })
    ).status(),
  ).toBe(401);

  await page.goto("/portal/updates");
  await expect(page.getByRole("heading", { name: "Updates", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No updates yet" })).toBeVisible();

  await signOut(page);
  await signIn(page, "maya@goaccess.com", "goaccess-admin-demo");
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/updates");
  await expect(page.getByRole("heading", { name: "Updates", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No draft updates" })).toBeVisible();

  // Server-side validation must reject non-web URL schemes even if browser validation is bypassed.
  const unsafeUrlResponse = await page.request.post("/api/updates", {
    data: {
      title: `Unsafe URL ${unique}`,
      summary: "Unsafe resource URL",
      body: "This must be rejected.",
      category: "operational_notice",
      resourceLabel: "Open resource",
      resourceUrl: "javascript:alert(document.domain)",
      action: "save_draft",
    },
  });
  expect(unsafeUrlResponse.status()).toBe(400);

  const draftResponse = await page.request.post("/api/updates", {
    data: {
      title: firstTitle,
      summary: unsafeMarkup,
      body: `Treat this content as plain text: ${unsafeMarkup}`,
      category: "operational_notice",
      resourceLabel: "Open release notes",
      resourceUrl,
      isPinned: true,
      action: "save_draft",
    },
  });
  expect(draftResponse.ok()).toBeTruthy();
  const firstUpdate = ((await draftResponse.json()) as { update: PartnerUpdate }).update;
  expect(firstUpdate).toMatchObject({ title: firstTitle, status: "draft", isPinned: true });

  // Drafts must not cross the vendor serialization boundary.
  await signOut(page);
  await signIn(page, "jordan@bluehavenintegrators.com", "goaccess-vendor-demo");
  const draftHiddenResponse = await page.request.get("/api/vendor-updates");
  expect(draftHiddenResponse.ok()).toBeTruthy();
  expect(JSON.stringify(await draftHiddenResponse.json())).not.toContain(firstTitle);
  await page.goto("/portal/updates");
  await expect(page.getByText(firstTitle, { exact: true })).toHaveCount(0);

  await signOut(page);
  await signIn(page, "maya@goaccess.com", "goaccess-admin-demo");
  const publishFirstResponse = await page.request.patch(`/api/updates/${firstUpdate.id}`, {
    data: { action: "publish" },
  });
  expect(publishFirstResponse.ok()).toBeTruthy();
  expect(await publishFirstResponse.json()).toMatchObject({
    update: { id: firstUpdate.id, status: "published", isPinned: true },
  });

  const publishSecondResponse = await page.request.post("/api/updates", {
    data: {
      title: secondTitle,
      summary: "The newest pinned release for partners.",
      body: "Review the latest product changes.",
      category: "product_update",
      isPinned: true,
      action: "publish",
    },
  });
  expect(publishSecondResponse.ok()).toBeTruthy();
  const secondUpdate = ((await publishSecondResponse.json()) as { update: PartnerUpdate }).update;
  expect(secondUpdate).toMatchObject({ title: secondTitle, status: "published", isPinned: true });

  const adminListResponse = await page.request.get("/api/updates");
  expect(adminListResponse.ok()).toBeTruthy();
  const adminUpdates = ((await adminListResponse.json()) as { updates: PartnerUpdate[] }).updates;
  expect(adminUpdates.find((update) => update.id === firstUpdate.id)).toMatchObject({
    status: "published",
    isPinned: false,
  });
  expect(adminUpdates.find((update) => update.id === secondUpdate.id)).toMatchObject({
    status: "published",
    isPinned: true,
  });

  await signOut(page);
  await signIn(page, "jordan@bluehavenintegrators.com", "goaccess-vendor-demo");
  const publishedResponse = await page.request.get("/api/vendor-updates");
  expect(publishedResponse.ok()).toBeTruthy();
  const publishedPayload = (await publishedResponse.json()) as { updates: ClientPartnerUpdate[] };
  const firstPublished = publishedPayload.updates.find((update) => update.id === firstUpdate.id);
  const secondPublished = publishedPayload.updates.find((update) => update.id === secondUpdate.id);
  expect(firstPublished).toBeDefined();
  expect(secondPublished).toBeDefined();
  expect(publishedPayload.updates[0]).toMatchObject({ id: secondUpdate.id, isPinned: true });

  for (const update of [firstPublished!, secondPublished!]) {
    expect(update).not.toHaveProperty("status");
    expect(update).not.toHaveProperty("createdByName");
    expect(update).not.toHaveProperty("createdByEmail");
    expect(update).not.toHaveProperty("archivedAt");
  }
  expect(JSON.stringify(publishedPayload).toLowerCase()).not.toContain("maya@goaccess.com");

  await page.goto("/portal/updates");
  await expect(page.getByText(firstTitle, { exact: true })).toBeVisible();
  await expect(page.getByText(secondTitle, { exact: true })).toBeVisible();
  const firstUpdateCard = page.locator(".vendor-update-card").filter({ hasText: firstTitle });
  await firstUpdateCard.getByText("Read full update", { exact: true }).click();
  await expect(firstUpdateCard.getByText("Treat this content as plain text:", { exact: false })).toBeVisible();
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as Window & { __updatesXss?: boolean }).__updatesXss)).toBeUndefined();
  await expect(page.getByRole("link", { name: "Open release notes" })).toHaveAttribute(
    "href",
    resourceUrl,
  );
  await expect(page.getByRole("link", { name: "Open release notes" })).toHaveAttribute(
    "rel",
    /noreferrer/,
  );

  await page.goto("/portal");
  await expect(page.getByText(secondTitle, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /View all updates/i })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/portal/updates");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobileNavigation = page.getByRole("navigation", { name: "Workspace pages" });
  await expect(mobileNavigation.getByRole("link", { name: "Updates" })).toBeVisible();

  // Archiving removes the item from every vendor surface while retaining it for admin history.
  await signOut(page);
  await signIn(page, "maya@goaccess.com", "goaccess-admin-demo");
  const archivePinnedResponse = await page.request.patch(`/api/updates/${secondUpdate.id}`, {
    data: { action: "archive" },
  });
  expect(archivePinnedResponse.ok()).toBeTruthy();
  expect(await archivePinnedResponse.json()).toMatchObject({
    update: { id: secondUpdate.id, status: "archived", isPinned: false },
  });
  const archiveFirstResponse = await page.request.patch(`/api/updates/${firstUpdate.id}`, {
    data: { action: "archive" },
  });
  expect(archiveFirstResponse.ok()).toBeTruthy();

  await signOut(page);
  await signIn(page, "jordan@bluehavenintegrators.com", "goaccess-vendor-demo");
  const archivedHiddenResponse = await page.request.get("/api/vendor-updates");
  expect(archivedHiddenResponse.ok()).toBeTruthy();
  const archivedHiddenJson = JSON.stringify(await archivedHiddenResponse.json());
  expect(archivedHiddenJson).not.toContain(firstTitle);
  expect(archivedHiddenJson).not.toContain(secondTitle);
  await page.goto("/portal/updates");
  await expect(page.getByRole("heading", { name: "No updates yet" })).toBeVisible();
});
