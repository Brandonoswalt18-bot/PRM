import { expect, test } from "@playwright/test";

test("public vendor application is accepted and protected APIs reject anonymous access", async ({
  page,
  request,
}) => {
  const unique = Date.now();

  await page.goto("/");
  await page.getByLabel("Company name").fill(`Playwright Partner ${unique}`);
  await page.getByLabel("Website").fill("https://playwright-partner.example");
  await page.getByLabel("City").fill("San Diego");
  await page.getByLabel("State").fill("CA");
  await page.getByLabel("Primary contact").fill("Taylor Test");
  await page.getByLabel("Work email").fill(`taylor+${unique}@example.com`);
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText(/application was submitted/i)).toBeVisible();

  const applications = await request.get("/api/vendor-applications");
  expect(applications.status()).toBe(401);
  const deals = await request.get("/api/deals");
  expect(deals.status()).toBe(401);
});

test("approved vendor completes NDA and Partner Terms before portal activation", async ({ page }) => {
  const unique = Date.now();
  const email = `onboarding+${unique}@example.com`;
  const submission = await page.request.post("/api/vendor-applications", {
    data: {
      companyName: `Onboarding Partner ${unique}`,
      website: "https://onboarding-partner.example",
      city: "San Diego",
      state: "CA",
      primaryContactName: "Alex Onboarding",
      primaryContactEmail: email,
    },
  });
  expect(submission.ok()).toBeTruthy();
  const submissionPayload = (await submission.json()) as { application: { id: string } };

  await page.goto("/login");
  await page.getByLabel("Email address").fill("maya@goaccess.com");
  await page.getByLabel("Password").fill("goaccess-admin-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  const approve = await page.request.patch(
    `/api/vendor-applications/${submissionPayload.application.id}`,
    { data: { status: "approved" } },
  );
  expect(approve.ok()).toBeTruthy();
  const startLegal = await page.request.patch(
    `/api/vendor-applications/${submissionPayload.application.id}`,
    { data: { status: "nda_sent" } },
  );
  expect(startLegal.ok()).toBeTruthy();
  const legalPayload = (await startLegal.json()) as { onboardingUrl: string };

  await page.goto(legalPayload.onboardingUrl);
  await expect(
    page.getByRole("heading", { name: "Complete the NDA and Terms & Conditions." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Open NDA document/ })).toHaveAttribute(
    "href",
    /17mAo8aotjxbz7tT-Xs0SGI1614IdmgEp/,
  );
  await expect(page.getByRole("link", { name: /Read Terms & Conditions/ })).toHaveAttribute(
    "href",
    /1--W8AKJPwh6L2CzSi-eTxYycSUUdNP7pAakEDFfIbgQ/,
  );

  await page.getByLabel("Signed NDA file").setInputFiles({
    name: "signed-goaccess-nda.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\nGoAccess onboarding test\n%%EOF"),
  });
  await page.getByRole("button", { name: "Upload signed NDA" }).click();
  await expect(page.getByText("Signed NDA uploaded. GoAccess will review it.")).toBeVisible();

  await page.getByLabel(/I have read and agree/).check();
  await page.getByRole("button", { name: "Accept Terms & Conditions" }).click();
  await expect(page.getByText("Terms & Conditions accepted and recorded.")).toBeVisible();
  await expect(page.locator(".onboarding-progress-card strong")).toHaveText("2 of 2 complete");

  const confirmLegal = await page.request.patch(
    `/api/vendor-applications/${submissionPayload.application.id}`,
    { data: { status: "nda_signed" } },
  );
  expect(confirmLegal.ok()).toBeTruthy();
  const issueAccess = await page.request.patch(
    `/api/vendor-applications/${submissionPayload.application.id}`,
    { data: { status: "credentials_issued" } },
  );
  expect(issueAccess.ok()).toBeTruthy();
  const accessPayload = (await issueAccess.json()) as { inviteUrl: string };

  await page.goto(accessPayload.inviteUrl);
  await page.getByLabel("Create password").fill("goaccess-onboarding-test");
  await page.getByLabel("Confirm password").fill("goaccess-onboarding-test");
  await page.getByRole("button", { name: "Activate vendor access" }).click();
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByRole("heading", { name: "Register your first deal" })).toBeVisible();
});

test("admin can sign in, use global search, and remains isolated from vendor pages", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("maya@goaccess.com");
  await page.getByLabel("Password").fill("goaccess-admin-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  const search = page.getByPlaceholder("Search deals, vendors, or applications");
  await expect(search).toBeVisible();
  await search.focus();
  await search.evaluate((element) => element.blur());
  await page.keyboard.press("/");
  await expect(search).toBeFocused();
  await search.fill("Blue Haven");
  await expect(page.getByText("Blue Haven Integrators").first()).toBeVisible();

  await page.goto("/portal");
  await expect(page).toHaveURL(/\/login\?next=%2Fportal/);
});

test("vendor can sign in and submit a complete deal registration", async ({ page }) => {
  const unique = Date.now();

  await page.goto("/login");
  await page.getByLabel("Email address").fill("jordan@bluehavenintegrators.com");
  await page.getByLabel("Password").fill("goaccess-vendor-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal$/);

  await page.goto("/portal/links");
  await page.getByLabel("Community name").fill(`Playwright Community ${unique}`);
  await page.getByLabel("Community address").fill("4127 Redwood Terrace");
  await page.getByLabel("Community website or domain").fill("playwright-community.example");
  await page.getByLabel("City").fill("San Diego");
  await page.getByLabel("State").fill("CA");
  await page.getByLabel("Contact name").fill("Jamie Sloan");
  await page.getByLabel("Contact email").fill(`jamie+${unique}@example.com`);
  await page.getByLabel("Contact phone").fill("555-555-0123");
  await page.getByLabel("Product interest").fill("Access control and video intercom");
  await page.getByLabel("Estimated project value").fill("25000");
  await page.getByLabel("Estimated monthly RMR").fill("1200");
  await page.getByLabel("Opportunity notes").fill("Automated isolated browser verification.");
  await page.getByRole("button", { name: "Submit deal for review" }).click();
  await expect(page.getByText("Deal registration submitted for GoAccess review.")).toBeVisible();

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
});

test("vendor mobile navigation keeps grouped destinations accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByLabel("Email address").fill("jordan@bluehavenintegrators.com");
  await page.getByLabel("Password").fill("goaccess-vendor-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal$/);

  await page.getByRole("button", { name: "Open navigation" }).click();
  const navigation = page.getByRole("navigation", { name: "Workspace pages" });
  await expect(navigation.getByText("Deal pipeline")).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Register deal" })).toBeVisible();
  await expect(navigation.getByText("Earnings")).toBeVisible();
  await navigation.getByRole("link", { name: "My deals" }).click();
  await expect(page).toHaveURL(/\/portal\/deals$/);
});
