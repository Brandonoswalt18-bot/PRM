import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

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
  const submissionResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/vendor-applications",
  );
  await page.getByRole("button", { name: "Submit application" }).click();
  const submissionResponse = await submissionResponsePromise;
  const submissionPayload = (await submissionResponse.json()) as Record<string, unknown>;
  const serializedSubmission = JSON.stringify(submissionPayload).toLowerCase();

  expect(Object.keys(submissionPayload).sort()).toEqual(["application", "message", "ok"]);
  expect(submissionPayload.application).toEqual(
    expect.objectContaining({ status: "submitted" }),
  );
  expect(Object.keys(submissionPayload.application as Record<string, unknown>).sort()).toEqual([
    "createdAt",
    "id",
    "status",
  ]);
  expect(serializedSubmission).not.toContain("internal-privacy-sentinel@goaccess.example");
  expect(serializedSubmission).not.toContain("notification");
  expect(serializedSubmission).not.toContain("reference");
  expect(serializedSubmission).not.toContain("resend");
  expect(serializedSubmission).not.toContain("email provider");
  await expect(page.getByText(/application has been submitted/i)).toBeVisible();

  const applications = await request.get("/api/vendor-applications");
  expect(applications.status()).toBe(401);
  const deals = await request.get("/api/deals");
  expect(deals.status()).toBe(401);
});

test("approved vendor accepts the NDA and Partner Agreement before portal activation", async ({ page }) => {
  test.setTimeout(120_000);
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
  const approvalPayload = (await approve.json()) as {
    hubspotCompanyHandoff: { status: string; action: string };
  };
  expect(approvalPayload.hubspotCompanyHandoff).toMatchObject({
    status: "failed",
    action: "failed",
  });

  const retryHubSpotCompanySync = await page.request.patch(
    `/api/vendor-applications/${submissionPayload.application.id}`,
    { data: { action: "retry_hubspot_company_sync" } },
  );
  expect(retryHubSpotCompanySync.status()).toBe(502);
  expect(await retryHubSpotCompanySync.json()).toMatchObject({
    ok: false,
    hubspotCompanyHandoff: { status: "failed", action: "failed" },
  });

  const startLegal = await page.request.patch(
    `/api/vendor-applications/${submissionPayload.application.id}`,
    { data: { status: "nda_sent" } },
  );
  expect(startLegal.ok()).toBeTruthy();
  const legalPayload = (await startLegal.json()) as { onboardingUrl: string };

  await page.goto(legalPayload.onboardingUrl);
  await expect(
    page.getByRole("heading", { name: "Review and accept both GoAccess agreements." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /View NDA PDF/ })).toHaveAttribute(
    "href", "/legal/goaccess-non-disclosure-agreement.pdf",
  );
  await expect(page.getByRole("link", { name: /View Partner Agreement PDF/ })).toHaveAttribute(
    "href", "/legal/goaccess-partner-terms.pdf",
  );

  const ndaCard = page.locator("article").filter({ hasText: "Accept the NDA" });
  await ndaCard.getByLabel("Title").fill("President");
  await ndaCard.getByRole("checkbox").check();
  await ndaCard.getByRole("button", { name: "Accept NDA" }).click();
  await expect(page.getByText("NDA accepted and recorded.")).toBeVisible();
  const acceptedNdaLink = page.getByRole("link", { name: "View accepted NDA" });
  const acceptedNdaHref = await acceptedNdaLink.getAttribute("href");
  expect(acceptedNdaHref).toMatch(/^\/api\/legal-agreements\/nda\/file\?token=/);
  const acceptedNdaResponse = await page.request.get(acceptedNdaHref!);
  expect(acceptedNdaResponse.ok()).toBeTruthy();
  expect(acceptedNdaResponse.headers()["content-type"]).toBe("application/pdf");
  const acceptedNdaPdf = await PDFDocument.load(await acceptedNdaResponse.body());
  expect(acceptedNdaPdf.getPageCount()).toBe(3);
  expect(acceptedNdaPdf.getTitle()).toContain("Accepted");

  const termsCard = page.locator("article").filter({ hasText: "Accept the Partner Agreement" });
  await termsCard.getByLabel("Title").fill("President");
  await termsCard.getByRole("checkbox").check();
  await termsCard.getByRole("button", { name: "Accept Partner Agreement" }).click();
  await expect(page.getByText("Partner Agreement accepted and recorded.")).toBeVisible();
  await expect(page.locator(".onboarding-progress-card strong")).toHaveText("2 of 2 complete");
  const acceptedTermsLink = page.getByRole("link", { name: "View accepted Partner Agreement" });
  const acceptedTermsHref = await acceptedTermsLink.getAttribute("href");
  expect(acceptedTermsHref).toMatch(/^\/api\/legal-agreements\/terms\/file\?token=/);
  const acceptedTermsResponse = await page.request.get(acceptedTermsHref!);
  expect(acceptedTermsResponse.ok()).toBeTruthy();
  expect(acceptedTermsResponse.headers()["content-type"]).toBe("application/pdf");
  expect(acceptedTermsResponse.headers()["cache-control"]).toBe("private, no-store");
  expect(acceptedTermsResponse.headers()["x-content-type-options"]).toBe("nosniff");
  expect(acceptedTermsResponse.headers()["content-disposition"]).toContain(
    "goaccess-partner-agreement-onboarding-partner-",
  );
  const acceptedTermsPdf = await PDFDocument.load(await acceptedTermsResponse.body());
  expect(acceptedTermsPdf.getPageCount()).toBe(8);
  expect(acceptedTermsPdf.getTitle()).toContain("GoAccess Partner Reseller Agreement - Accepted");
  expect(acceptedTermsPdf.getSubject()).toContain("Electronically accepted on");

  const onboardingToken = decodeURIComponent(
    new URL(legalPayload.onboardingUrl).pathname.split("/").filter(Boolean).at(-1)!,
  );
  const repeatedAcceptance = await page.request.post(
    `/api/onboarding/${encodeURIComponent(onboardingToken)}/terms`,
    {
      form: {
        accepted: "yes",
        acceptedBy: "Replacement Signer",
        acceptedTitle: "Unauthorized Revision",
      },
    },
  );
  expect(repeatedAcceptance.ok()).toBeTruthy();

  const issueAccess = await page.request.patch(
    `/api/vendor-applications/${submissionPayload.application.id}`,
    { data: { status: "credentials_issued" } },
  );
  expect(issueAccess.ok()).toBeTruthy();
  const accessPayload = (await issueAccess.json()) as {
    inviteUrl: string;
    vendor: {
      ndaAcceptedBy?: string;
      ndaAcceptedTitle?: string;
      ndaDocumentSha256?: string;
      ndaVersion?: string;
      termsAcceptedBy?: string;
      termsAcceptedTitle?: string;
      termsDocumentSha256?: string;
      termsVersion?: string;
    };
  };
  expect(accessPayload.vendor).toMatchObject({
    ndaAcceptedBy: "Alex Onboarding",
    ndaAcceptedTitle: "President",
    ndaDocumentSha256: "28a206cc072f9c2eff9494c537c63f3a335fe74e564093d18f3f37c56af0f2b5",
    ndaVersion: "2026-07.1",
    termsAcceptedBy: "Alex Onboarding",
    termsAcceptedTitle: "President",
    termsDocumentSha256: "6623fb6c81c0e4ad26ccdb8c96b2b26cb7df56a846d6a66657078fb5870d6e94",
    termsVersion: "2026-07.1",
  });

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
  test.setTimeout(120_000);
  const unique = Date.now();

  await page.goto("/login");
  await page.getByLabel("Email address").fill("jordan@bluehavenintegrators.com");
  await page.getByLabel("Password").fill("goaccess-vendor-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal$/);
  await expect(
    page.getByRole("heading", { name: "Welcome back, Blue Haven Integrators", exact: true }),
  ).toBeVisible();
  const historicalTermsResponse = await page.request.get("/api/legal-agreements/terms/file");
  expect(historicalTermsResponse.ok()).toBeTruthy();
  const historicalTermsPdf = await PDFDocument.load(await historicalTermsResponse.body());
  expect(historicalTermsPdf.getPageCount()).toBe(8);
  expect(historicalTermsPdf.getTitle()).toContain(
    "GoAccess Channel Partner Service Agreement - Accepted",
  );
  const vendorNavigation = page.getByRole("navigation", { name: "Workspace pages" });
  const agreementsLink = vendorNavigation.getByRole("link", { name: "Agreements" });
  await expect(agreementsLink).toBeVisible();
  await agreementsLink.click();
  await expect(page).toHaveURL(/\/portal\/onboarding$/);
  await expect(page.getByRole("heading", { name: "Agreements", exact: true })).toBeVisible();
  await expect(vendorNavigation.getByRole("link", { name: "Agreements" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.goto("/portal");
  await expect(
    vendorNavigation.getByRole("link", { name: "Training", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Learn at your own pace" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/RMR|earnings|payout/i);
  await page.getByLabel("Account menu for Jordan Lee").click();
  const accountMenu = page.locator(".session-menu");
  await expect(accountMenu.getByRole("link", { name: "Agreements" })).toHaveCount(0);
  await expect(accountMenu.getByRole("link", { name: "Profile" })).toBeVisible();
  await expect(accountMenu.getByRole("link", { name: "Support" })).toBeVisible();
  await expect(accountMenu.getByRole("link", { name: "Sign out" })).toBeVisible();
  await expect(page.locator(".training-preview-card")).toHaveCount(4);
  for (const title of [
    "Portico — Security Check-in SOP",
    "Vaidio Edge — LPR Training",
    "GoAccess Resident Training Demonstration",
    "Guard Tablet — Visitor Check-in",
  ]) {
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  }

  await page.goto("/portal/learning");
  await expect(page.locator(".learning-video-panel .training-asset-card")).toHaveCount(4);
  await expect(page.locator(".learning-document-panel .training-library-empty")).toBeVisible();
  await expect(page.getByText("4 available", { exact: true })).toBeVisible();
  await expect(page.getByText("0 available", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("maya@goaccess.com");

  const vendorProfileResponse = await page.request.get("/api/vendor-profile");
  expect(vendorProfileResponse.ok()).toBeTruthy();
  expect(JSON.stringify(await vendorProfileResponse.json()).toLowerCase()).not.toContain("hubspot");

  await page.goto("/portal/deals/new");
  const dealForm = page.locator("form.deal-registration-form");
  await expect(dealForm.getByText("Required", { exact: true })).toHaveCount(0);
  await expect(dealForm.getByText("Optional", { exact: true })).toHaveCount(1);
  await expect(dealForm.locator(".deal-form-requirements")).toHaveCount(0);
  await expect(dealForm.locator('[name="companyName"]')).toHaveAttribute("required", "");
  await expect(dealForm.locator('[name="domain"]')).not.toHaveAttribute("required", "");
  await page.getByRole("button", { name: "Submit deal for review" }).click();
  await expect(dealForm.getByRole("alert")).toContainText("Check the highlighted fields");
  await expect(dealForm.locator(".field-error-text")).toHaveCount(8);
  await expect(dealForm).not.toContainText(/required/i);
  await expect(dealForm.locator(".field-error-text").first()).toHaveText(
    "Enter the community name.",
  );
  await expect(dealForm.locator('[name="domain"]')).toHaveAttribute("aria-invalid", "false");
  await expect(dealForm.locator('[name="companyName"]')).toBeFocused();
  await expect(dealForm.locator('[name="companyName"]')).toHaveAttribute("aria-invalid", "true");

  await page.getByLabel("Community name").fill(`Playwright Community ${unique}`);
  await page.getByLabel("Community address").fill("4127 Redwood Terrace");
  await page.getByLabel("City").fill("San Diego");
  await page.getByLabel("State").fill("CA");
  await page.getByLabel("Contact name").fill("Jamie Sloan");
  await page.getByLabel("Contact email").fill(`jamie+${unique}@example.com`);
  await page.getByLabel("Contact phone").fill("555-555-0123");
  await page.getByLabel("Product interest").fill("Access control and video intercom");
  await expect(page.getByLabel("Estimated project value")).toHaveCount(0);
  await expect(page.getByLabel("Estimated monthly RMR")).toHaveCount(0);
  await page.getByLabel("Opportunity notes").fill("Automated isolated browser verification.");
  await expect(dealForm.locator(".field-error-text")).toHaveCount(0);
  await expect(dealForm.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Submit deal for review" }).click();
  await expect(page.getByText("Deal registration submitted for GoAccess review.")).toBeVisible();

  const dealsResponse = await page.request.get("/api/deals");
  expect(dealsResponse.ok()).toBeTruthy();
  const dealsPayload = (await dealsResponse.json()) as {
    items: Array<Record<string, unknown> & { id: string; companyName: string; status: string }>;
  };
  const submittedDeal = dealsPayload.items.find(
    (deal) => deal.companyName === `Playwright Community ${unique}`,
  );
  expect(submittedDeal).toBeDefined();
  expect(submittedDeal?.domain).toBe("");
  expect(submittedDeal).not.toHaveProperty("monthlyRmr");
  expect(submittedDeal).not.toHaveProperty("expectedMonthlyRmr");
  expect(submittedDeal).not.toHaveProperty("vendorPayoutType");
  expect(submittedDeal).not.toHaveProperty("vendorPayoutRate");
  expect(submittedDeal).not.toHaveProperty("expectedVendorMonthlyRevenue");
  expect(submittedDeal).not.toHaveProperty("estimatedValue");
  expect(JSON.stringify(submittedDeal).toLowerCase()).not.toContain("hubspot");

  await page.goto(`/portal/deals/${submittedDeal!.id}`);
  await expect(page.getByRole("heading", { name: `Playwright Community ${unique}` })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/RMR|earnings|payout|estimated value|hubspot|crm/i);

  for (const path of [
    "/portal",
    "/portal/deals/new",
    "/portal/deals",
    "/portal/learning",
    "/portal/support",
    "/portal/profile",
  ]) {
    await page.goto(path);
    await expect(page.locator("body")).not.toContainText(/hubspot|crm/i);
  }

  await page.goto("/portal/links");
  await expect(page).toHaveURL(/\/portal\/deals\/new$/);
  await page.goto("/portal/earnings");
  await expect(page).toHaveURL(/\/portal\/deals$/);
  await page.goto("/portal/payouts");
  await expect(page).toHaveURL(/\/portal\/deals$/);
  await page.goto("/portal/assets");
  await expect(page).toHaveURL(/\/portal\/learning$/);

  const tamperedFinancials = await page.request.post("/api/deals", {
    data: {
      companyName: `RMR Ownership Test ${unique}`,
      communityAddress: "99 Admin Control Way",
      city: "San Diego",
      state: "CA",
      domain: `rmr-ownership-${unique}.example`,
      contactName: "Revenue Test",
      contactEmail: `revenue+${unique}@example.com`,
      contactPhone: "555-555-0199",
      estimatedValue: 999999,
      monthlyRmr: 999999,
      productInterest: "Access control",
      notes: "Client-supplied RMR must be ignored.",
    },
  });
  expect(tamperedFinancials.ok()).toBeTruthy();
  const tamperedPayload = (await tamperedFinancials.json()) as { deal: Record<string, unknown> };
  expect(tamperedPayload.deal).not.toHaveProperty("monthlyRmr");
  expect(tamperedPayload.deal).not.toHaveProperty("expectedMonthlyRmr");
  expect(tamperedPayload.deal).not.toHaveProperty("expectedVendorMonthlyRevenue");
  expect(tamperedPayload.deal).not.toHaveProperty("estimatedValue");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/portal/deals/new");
  const mobileDealForm = page.locator("form.deal-registration-form");
  await page.getByRole("button", { name: "Submit deal for review" }).click();
  await expect(mobileDealForm.getByRole("alert")).toBeVisible();
  await expect(mobileDealForm.locator('[name="companyName"]')).toBeFocused();
  await expect(mobileDealForm.locator('[name="companyName"]')).toBeInViewport();
  await expect(page.getByRole("button", { name: "Submit deal for review" })).toHaveCSS(
    "min-height",
    "44px",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
  ).toBeTruthy();

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login\?next=%2Fapp/);
});

test("unsigned vendor is limited to required legal onboarding", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address or username").fill("Alex");
  await page.getByLabel("Password").fill("12345678");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal\/onboarding$/);

  await expect(page.getByRole("heading", { name: "Agreements", exact: true })).toBeVisible();
  const legalStatus = page.locator("#legal-agreements");
  await expect(legalStatus.getByRole("link", { name: "View NDA PDF" })).toHaveAttribute(
    "href", "/legal/goaccess-non-disclosure-agreement.pdf",
  );
  await expect(legalStatus.getByRole("link", { name: "View Partner Agreement PDF" })).toHaveAttribute(
    "href", "/legal/goaccess-partner-terms.pdf",
  );
  const legalNavigation = page.getByRole("navigation", { name: "Workspace pages" });
  await expect(legalNavigation.getByRole("link", { name: "Agreements" })).toBeVisible();
  await expect(legalNavigation.getByRole("link", { name: "Home" })).toHaveCount(0);
  await expect(legalNavigation.getByRole("link", { name: "Deals" })).toHaveCount(0);
  await expect(legalNavigation.getByRole("link", { name: "Training" })).toHaveCount(0);

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
      monthlyRmr: 999999,
      productInterest: "Access control",
      notes: "This request must be rejected until legal onboarding is complete.",
    },
  });
  expect(blockedSubmission.status()).toBe(403);

  await page.goto("/portal/deals/new");
  await expect(page).toHaveURL(/\/portal\/onboarding\?required=legal$/);
  await expect(page.getByRole("heading", { name: "Agreements" })).toBeVisible();
  const ndaCard = page.locator("section.legal-acceptance-card").filter({ hasText: "Non-Disclosure Agreement" });
  const termsCard = page.locator("section.legal-acceptance-card").filter({ hasText: "Partner Reseller Agreement" });
  await ndaCard.getByLabel("Title").fill("Test Vendor");
  await ndaCard.getByRole("checkbox").check();
  await ndaCard.getByRole("button", { name: "Accept NDA" }).click();
  await expect(ndaCard.getByText("Accepted", { exact: true })).toBeVisible();
  await expect(termsCard.getByText("Required", { exact: true })).toBeVisible();
  await expect(termsCard.getByRole("button", { name: "Accept Partner Agreement" })).toBeVisible();

  const stillBlocked = await page.request.post("/api/deals", {
    data: {
      companyName: "NDA Only Block Test",
      communityAddress: "2 Test Way",
      city: "San Diego",
      state: "CA",
      domain: "nda-only-blocked.example",
      contactName: "Blocked Contact",
      contactEmail: "nda-only-blocked@example.com",
      contactPhone: "555-0101",
      productInterest: "Access control",
      notes: "The Partner Agreement is still required.",
    },
  });
  expect(stillBlocked.status()).toBe(403);
});

test("GoAccess admin can approve without RMR and add internal RMR later", async ({ page }) => {
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
      estimatedValue: 999999,
      monthlyRmr: 999999,
      productInterest: "Access control",
      notes: "Admin ownership verification.",
    },
  });
  expect(submission.ok()).toBeTruthy();
  const submissionPayload = (await submission.json()) as {
    deal: { id: string } & Record<string, unknown>;
  };
  expect(submissionPayload.deal).not.toHaveProperty("monthlyRmr");

  await page.goto("/auth/logout");
  await page.getByLabel("Email address").fill("maya@goaccess.com");
  await page.getByLabel("Password").fill("goaccess-admin-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);

  const startReview = await page.request.patch(`/api/deals/${submissionPayload.deal.id}`, {
    data: { status: "under_review" },
  });
  expect(startReview.ok()).toBeTruthy();
  expect(await startReview.json()).toMatchObject({
    deal: { estimatedValue: 0, monthlyRmr: 0 },
  });

  const approval = await page.request.patch(`/api/deals/${submissionPayload.deal.id}`, {
    data: { status: "approved" },
  });
  expect(approval.ok()).toBeTruthy();
  const approvalPayload = (await approval.json()) as {
    deal: { status: string; monthlyRmr: number };
    hubspot?: { syncDecision?: string };
    message: string;
  };
  expect(approvalPayload.deal).toMatchObject({ status: "approved", monthlyRmr: 0 });
  expect(approvalPayload.hubspot?.syncDecision).toBe("blocked_configuration");
  expect(approvalPayload.message).toContain("Deal approved");

  const adminRmr = await page.request.patch(`/api/deals/${submissionPayload.deal.id}`, {
    data: { monthlyRmr: 850 },
  });
  expect(adminRmr.ok()).toBeTruthy();
  const adminRmrPayload = (await adminRmr.json()) as { deal: { monthlyRmr: number } };
  expect(adminRmrPayload.deal.monthlyRmr).toBe(850);
});

test("deal decisions notify the vendor, retain an admin audit trail, and share decline reasons safely", async ({
  page,
}) => {
  const unique = Date.now();

  await page.goto("/login");
  await page.getByLabel("Email address").fill("jordan@bluehavenintegrators.com");
  await page.getByLabel("Password").fill("goaccess-vendor-demo");
  await page.getByRole("button", { name: "Sign in" }).click();

  const submitDeal = async (label: string) => {
    const slug = label.toLowerCase().replaceAll(" ", "-");
    const response = await page.request.post("/api/deals", {
      data: {
        companyName: `${label} ${unique}`,
        communityAddress: "240 Decision Trail",
        city: "San Diego",
        state: "CA",
        domain: `${slug}-${unique}.example`,
        contactName: "Decision Contact",
        contactEmail: `decision+${slug}-${unique}@example.com`,
        contactPhone: "555-555-0144",
        productInterest: "Access control",
        notes: "Deal decision workflow verification.",
      },
    });
    expect(response.ok()).toBeTruthy();
    return (await response.json()) as { deal: { id: string } };
  };

  const approvedSubmission = await submitDeal("Approved Decision");
  const declinedSubmission = await submitDeal("Declined Decision");

  await page.goto("/auth/logout");
  await page.getByLabel("Email address").fill("maya@goaccess.com");
  await page.getByLabel("Password").fill("goaccess-admin-demo");
  await page.getByRole("button", { name: "Sign in" }).click();

  for (const dealId of [approvedSubmission.deal.id, declinedSubmission.deal.id]) {
    const review = await page.request.patch(`/api/deals/${dealId}`, {
      data: { status: "under_review" },
    });
    expect(review.ok()).toBeTruthy();
  }

  const monthlyRmr = await page.request.patch(`/api/deals/${approvedSubmission.deal.id}`, {
    data: { monthlyRmr: 625 },
  });
  expect(monthlyRmr.ok()).toBeTruthy();

  const approval = await page.request.patch(`/api/deals/${approvedSubmission.deal.id}`, {
    data: { status: "approved" },
  });
  expect(approval.ok()).toBeTruthy();
  const approvalPayload = (await approval.json()) as {
    handoffStatus: string;
    decisionAuditEntry: {
      decision: string;
      decidedByName: string;
      decidedByEmail: string;
      createdAt: string;
    };
    decisionNotification: { category: string; recipientEmail: string; status: string };
  };
  expect(approvalPayload.decisionAuditEntry).toMatchObject({
    decision: "approved",
    decidedByName: "Maya Chen",
    decidedByEmail: "maya@goaccess.com",
  });
  expect(approvalPayload.decisionAuditEntry.createdAt).toBeTruthy();
  expect(approvalPayload.handoffStatus).toBe("held");
  expect(approvalPayload.decisionNotification).toMatchObject({
    category: "deal_approved",
    recipientEmail: "jordan@bluehavenintegrators.com",
    status: "logged",
  });

  const declineReason = "The community is already registered through another authorized vendor.";
  const decline = await page.request.patch(`/api/deals/${declinedSubmission.deal.id}`, {
    data: { status: "rejected", declineReason },
  });
  expect(decline.ok()).toBeTruthy();
  const declinePayload = (await decline.json()) as {
    deal: { declineReason?: string; decisionAt?: string };
    decisionAuditEntry: {
      decision: string;
      declineReason?: string;
      decidedByEmail: string;
    };
    decisionNotification: { category: string; recipientEmail: string; status: string };
  };
  expect(declinePayload.deal).toMatchObject({ declineReason });
  expect(declinePayload.deal.decisionAt).toBeTruthy();
  expect(declinePayload.decisionAuditEntry).toMatchObject({
    decision: "rejected",
    declineReason,
    decidedByEmail: "maya@goaccess.com",
  });
  expect(declinePayload.decisionNotification).toMatchObject({
    category: "deal_declined",
    recipientEmail: "jordan@bluehavenintegrators.com",
    status: "logged",
  });

  const adminDeal = await page.request.get(`/api/deals/${declinedSubmission.deal.id}`);
  expect(adminDeal.ok()).toBeTruthy();
  const adminDealPayload = (await adminDeal.json()) as {
    decisionAudit: Array<{
      decision: string;
      declineReason?: string;
      decidedByEmail: string;
    }>;
  };
  expect(adminDealPayload.decisionAudit[0]).toMatchObject({
    decision: "rejected",
    declineReason,
    decidedByEmail: "maya@goaccess.com",
  });

  await page.goto("/auth/logout");
  await page.getByLabel("Email address").fill("jordan@bluehavenintegrators.com");
  await page.getByLabel("Password").fill("goaccess-vendor-demo");
  await page.getByRole("button", { name: "Sign in" }).click();

  const vendorDeals = await page.request.get("/api/deals");
  expect(vendorDeals.ok()).toBeTruthy();
  const vendorPayload = (await vendorDeals.json()) as {
    items: Array<{ id: string; declineReason?: string; decisionAt?: string }>;
  };
  const vendorDeclinedDeal = vendorPayload.items.find(
    (deal) => deal.id === declinedSubmission.deal.id,
  );
  expect(vendorDeclinedDeal).toMatchObject({ declineReason });
  expect(vendorDeclinedDeal?.decisionAt).toBeTruthy();
  expect(JSON.stringify(vendorPayload)).not.toContain("maya@goaccess.com");
  expect(JSON.stringify(vendorPayload).toLowerCase()).not.toContain("hubspot");
});

test("vendor mobile navigation keeps grouped destinations accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.getByLabel("Email address").fill("jordan@bluehavenintegrators.com");
  await page.getByLabel("Password").fill("goaccess-vendor-demo");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/portal$/);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Welcome back, Blue Haven Integrators", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page
      .getByRole("dialog", { name: "VENDOR PORTAL navigation" })
      .getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  await expect(page.locator("#workspace-navigation")).not.toHaveClass(/is-mobile-open/);

  await page.getByRole("button", { name: "Open navigation" }).click();
  const navigation = page.getByRole("navigation", { name: "Workspace pages" });
  await expect(navigation.getByText("Portal")).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Agreements" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Deals" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Training" })).toBeVisible();
  await expect(navigation.getByText("Earnings")).toHaveCount(0);
  await navigation.getByRole("link", { name: "Deals" }).click();
  await expect(page).toHaveURL(/\/portal\/deals$/);
});
