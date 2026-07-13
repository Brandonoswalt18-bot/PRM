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
  await expect(page.getByLabel("Estimated monthly RMR")).toHaveCount(0);
  await page.getByLabel("Opportunity notes").fill("Automated isolated browser verification.");
  await page.getByRole("button", { name: "Submit deal for review" }).click();
  await expect(page.getByText("Deal registration submitted for GoAccess review.")).toBeVisible();

  const dealsResponse = await page.request.get("/api/deals");
  expect(dealsResponse.ok()).toBeTruthy();
  const dealsPayload = (await dealsResponse.json()) as {
    items: Array<{ companyName: string; monthlyRmr: number }>;
  };
  expect(
    dealsPayload.items.find((deal) => deal.companyName === `Playwright Community ${unique}`)?.monthlyRmr,
  ).toBe(0);

  const tamperedRmr = await page.request.post("/api/deals", {
    data: {
      companyName: `RMR Ownership Test ${unique}`,
      communityAddress: "99 Admin Control Way",
      city: "San Diego",
      state: "CA",
      domain: `rmr-ownership-${unique}.example`,
      contactName: "Revenue Test",
      contactEmail: `revenue+${unique}@example.com`,
      contactPhone: "555-555-0199",
      estimatedValue: 10000,
      monthlyRmr: 999999,
      productInterest: "Access control",
      notes: "Client-supplied RMR must be ignored.",
    },
  });
  expect(tamperedRmr.ok()).toBeTruthy();
  const tamperedPayload = (await tamperedRmr.json()) as { deal: { monthlyRmr: number } };
  expect(tamperedPayload.deal.monthlyRmr).toBe(0);

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
});

test("unsigned vendor is limited to required legal onboarding", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("unsigned.vendor@goaccess.com");
  await page.getByLabel("Password").fill("goaccess-unsigned-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal$/);

  await expect(page.getByRole("heading", { name: "Complete your vendor agreements" })).toBeVisible();
  const legalStatus = page.getByRole("region", { name: "Finish your NDA and Partner Terms" });
  await expect(legalStatus.getByRole("link", { name: "Download NDA" })).toHaveAttribute(
    "href",
    /17mAo8aotjxbz7tT-Xs0SGI1614IdmgEp/,
  );
  await expect(legalStatus.getByRole("link", { name: "View Partner Terms" })).toHaveAttribute(
    "href",
    /1--W8AKJPwh6L2CzSi-eTxYycSUUdNP7pAakEDFfIbgQ/,
  );
  await expect(page.getByRole("link", { name: "Register deal" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Monthly RMR" })).toHaveCount(0);

  const blockedSubmission = await page.request.post("/api/deals", {
    data: {
      companyName: "Blocked Legal Test",
      communityAddress: "1 Test Way",
      city: "San Diego",
      state: "CA",
      domain: "blocked.example",
      contactName: "Blocked Contact",
      contactEmail: "blocked@example.com",
      contactPhone: "555-0100",
      estimatedValue: 1000,
      monthlyRmr: 999999,
      productInterest: "Access control",
      notes: "This request must be rejected until legal onboarding is complete.",
    },
  });
  expect(blockedSubmission.status()).toBe(403);

  await page.goto("/portal/links");
  await expect(page).toHaveURL(/\/portal\/onboarding\?required=legal$/);
  await expect(page.getByRole("heading", { name: "Onboarding" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Accept Partner Terms" })).toBeVisible();
});

test("GoAccess admin owns monthly RMR before deal approval", async ({ page }) => {
  const unique = Date.now();

  await page.goto("/login");
  await page.getByLabel("Email address").fill("jordan@bluehavenintegrators.com");
  await page.getByLabel("Password").fill("goaccess-vendor-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal$/);

  const submission = await page.request.post("/api/deals", {
    data: {
      companyName: `Admin RMR Test ${unique}`,
      communityAddress: "100 Revenue Way",
      city: "San Diego",
      state: "CA",
      domain: `admin-rmr-${unique}.example`,
      contactName: "RMR Contact",
      contactEmail: `rmr+${unique}@example.com`,
      contactPhone: "555-555-0188",
      estimatedValue: 20000,
      monthlyRmr: 999999,
      productInterest: "Access control",
      notes: "Admin ownership verification.",
    },
  });
  expect(submission.ok()).toBeTruthy();
  const submissionPayload = (await submission.json()) as {
    deal: { id: string; monthlyRmr: number };
  };
  expect(submissionPayload.deal.monthlyRmr).toBe(0);

  await page.goto("/auth/logout");
  await page.getByLabel("Email address").fill("maya@goaccess.com");
  await page.getByLabel("Password").fill("goaccess-admin-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  const startReview = await page.request.patch(`/api/deals/${submissionPayload.deal.id}`, {
    data: { status: "under_review" },
  });
  expect(startReview.ok()).toBeTruthy();

  const blockedApproval = await page.request.patch(`/api/deals/${submissionPayload.deal.id}`, {
    data: { status: "approved" },
  });
  expect(blockedApproval.status()).toBe(400);

  const adminRmr = await page.request.patch(`/api/deals/${submissionPayload.deal.id}`, {
    data: { monthlyRmr: 850 },
  });
  expect(adminRmr.ok()).toBeTruthy();
  const adminRmrPayload = (await adminRmr.json()) as { deal: { monthlyRmr: number } };
  expect(adminRmrPayload.deal.monthlyRmr).toBe(850);
});

test("vendor mobile navigation keeps grouped destinations accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByLabel("Email address").fill("jordan@bluehavenintegrators.com");
  await page.getByLabel("Password").fill("goaccess-vendor-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal$/);
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "Open navigation" }).click();
  const navigation = page.getByRole("navigation", { name: "Workspace pages" });
  await expect(navigation.getByText("Deal pipeline")).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Register deal" })).toBeVisible();
  await expect(navigation.getByText("Earnings")).toBeVisible();
  await navigation.getByRole("link", { name: "My deals" }).click();
  await expect(page).toHaveURL(/\/portal\/deals$/);
});
