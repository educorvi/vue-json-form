import { test, expect } from '@playwright/test';

/**
 * This file intentionally starts with NO stored session (overriding the
 * `chromium` project's `storageState`), because it tests the login flow
 * itself from a logged-out state.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
    test('shows an error banner when Keycloak reports an auth failure', async ({
        page,
    }) => {
        await page.goto('/login?error=auth_failed');

        await expect(page.getByText(/authentication failed/i)).toBeVisible();
    });

    test('redirects to Keycloak and back to the dashboard on success', async ({
        page,
    }) => {
        await page.goto('/login');
        await expect(
            page.getByRole('heading', { name: 'Form Builder' })
        ).toBeVisible();

        // Given a logged-out visitor on the login page
        // When they sign in with Keycloak using the seeded dev-realm user
        await page
            .getByRole('link', { name: /sign in with keycloak/i })
            .click();
        await expect(page).toHaveURL(/\/realms\/dev\//);

        await page.getByLabel(/username or email/i).fill('test');
        await page.getByLabel('Password', { exact: true }).fill('test');
        await page.getByRole('button', { name: /^sign in$/i }).click();

        // Then they land back on the dashboard, authenticated
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByText(/welcome/i)).toBeVisible();
    });
});
