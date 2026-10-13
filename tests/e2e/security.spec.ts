import { test, expect } from "@playwright/test";

test("sign-in hydrates under nonce CSP without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  const response = await page.goto("/sign-in");
  expect(response?.headers()["content-security-policy"]).toContain("'nonce-");
  expect(response?.headers()["content-security-policy"]).not.toContain("'unsafe-eval'");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await page.getByLabel("Email Address").fill("test@example.test");
  await page.getByLabel("Password", { exact: true }).fill("test-password-123");
  await page.getByRole("button", { name: "Access Operations" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "temporarily unavailable" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Aero Stays branding and password visibility work on the sign-in screen", async ({ page }) => {
  await page.goto("/sign-in");
  const logo = page.getByRole("link", { name: "Aero Stays home" });
  await expect(logo).toBeVisible();
  await expect(logo.locator("svg")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
});

test("dashboard requires sign-in and preserves internal destination", async ({ page }) => {
  await page.goto("/dashboard/bookings");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard%2Fbookings/);
});

test("signup is disabled", async ({ page }) => {
  await page.goto("/sign-up");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("protected APIs reject unauthenticated and cross-origin requests", async ({ request }) => {
  expect((await request.get("/api/v1/export?dataset=guests&from=2030-01-01&to=2030-01-31")).status()).toBe(401);
  expect((await request.get("/api/v1/properties")).status()).toBe(401);
  expect((await request.get("/api/health")).status()).toBe(401);
  expect((await request.post("/api/v1/properties", { data: {}, headers: { origin: "https://attacker.example" } })).status()).toBe(403);
  expect((await request.post("/api/v1/properties", { data: {}, headers: { origin: "http://127.0.0.1:3100" } })).status()).toBe(401);
});

for (const route of ["cleaning", "maintenance", "expenses", "reports", "settings", "data", "import"]) {
  test(`${route} workflow requires sign-in`, async ({ page }) => {
    await page.goto(`/dashboard/${route}`);
    await expect(page).toHaveURL(new RegExp(`/sign-in\\?next=%2Fdashboard%2F${route}`));
  });
}

test("recovery rejects invalid links and does not disclose account existence", async ({ page }) => {
  await page.goto("/auth/recovery?code=invalid&type=recovery");
  await expect(page).toHaveURL(/\/forgot-password/);
  await page.getByLabel(/email/i).fill("nobody@example.test");
  await page.getByRole("button", { name: /send/i }).click();
  await expect(page.getByText("If an account exists for this email, we sent password reset instructions.")).toBeVisible();
});

test("health check reports backend failure without disclosing details", async ({ request }) => {
  const response = await request.get("/api/health", { headers: { authorization: "Bearer local-test-health-secret-at-least-32-characters" } });
  expect(response.status()).toBe(503);
  expect(await response.json()).toEqual({ status: "unavailable" });
});
