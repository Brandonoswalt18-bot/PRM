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
  await page.getByLabel("Email address").fill(`taylor+${unique}@example.com`);
  await page.getByRole("button", { name: "Submit vendor application" }).click();
  await expect(page.getByText(/application was submitted/i)).toBeVisible();

  const applications = await request.get("/api/vendor-applications");
  expect(applications.status()).toBe(401);
  const deals = await request.get("/api/deals");
  expect(deals.status()).toBe(401);
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
