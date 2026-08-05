import { test, expect } from '@playwright/test';

/**
 * Uses the authenticated session persisted by tests/e2e/setup/auth.setup.ts
 * (see the `chromium` project's `storageState` in playwright.config.ts),
 * so no login flow needs to run again here.
 */
test.describe('Dashboard', () => {
    test("renders a welcome message with the logged-in user's real name", async ({
        page,
    }) => {
        // Given the test user is logged in (persisted session)

        // When they open the dashboard
        await page.goto('/dashboard');

        // Then the welcome heading shows the user's real name.
        await expect(
            page.getByRole('heading', { name: /welcome, test user/i })
        ).toBeVisible();
    });

    test('renders the recently added forms section', async ({ page }) => {
        // Given the test user is logged in (persisted session)

        // When they open the dashboard
        await page.goto('/dashboard');

        // Then the recent-forms section is rendered
        await expect(page.getByTestId('dashboard-recent-forms')).toBeVisible();
    });

    test('redirects from the landing page / root to the dashboard when the user is logged in', async ({
        page,
    }) => {
        // Given the test user is logged in (persisted session)

        // When they open the landing page
        await page.goto('/');

        // Then they are redirected to the dashboard
        await expect(page).toHaveURL(/\/dashboard/);
    });
});
