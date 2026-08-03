import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

/**
 * Runs once before the `chromium` project (see playwright.config.ts
 * `dependencies: ['setup']`). Performs the real Keycloak OIDC login flow
 * using the `test` / `test` dev-realm user (see keycloak/dev-realm.json
 * and the app README) and persists the resulting session cookie so the
 * rest of the E2E suite can skip repeating the login flow on every test.
 */
const authFile = fileURLToPath(new URL('./.auth/user.json', import.meta.url));

setup('authenticate as the seeded test user', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /sign in with keycloak/i }).click();

    // Keycloak's hosted login form.
    await page.getByLabel(/username or email/i).fill('test');
    await page.getByLabel('Password', { exact: true }).fill('test');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();

    await page.context().storageState({ path: authFile });
});
