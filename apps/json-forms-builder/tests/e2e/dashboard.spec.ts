import { test, expect } from '@playwright/test';

/**
 * Uses the authenticated session persisted by tests/e2e/auth.setup.ts
 * (see the `chromium` project's `storageState` in playwright.config.ts),
 * so no login flow needs to run again here.
 */
test.describe('Dashboard', () => {
    test("renders a welcome message with the logged-in user's real name", async ({
        page,
    }) => {
        await page.goto('/dashboard');

        // The `test`/`test` Keycloak user seeded by server/db/seed.ts has
        // display name "Test User" — asserting the actual name (not just
        // generic "welcome" text) guards against the userName computed
        // silently falling back to the generic 'User' default.
        await expect(
            page.getByRole('heading', { name: /welcome, test user/i })
        ).toBeVisible();
    });

    test('renders the recently added forms section', async ({ page }) => {
        await page.goto('/dashboard');

        await expect(page.getByTestId('dashboard-recent-forms')).toBeVisible();
    });
});
