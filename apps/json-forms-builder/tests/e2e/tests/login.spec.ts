import { test, expect } from '@playwright/test';
import { loginAs } from '../setup/login-helper';

/**
 * Given A logged-out visitor
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login', () => {
    test('shows an error banner when Keycloak reports an auth failure', async ({
        page,
    }) => {
        // When: A logged-out visitor on the login page has done a failed auth attempt (Keycloak redirected back with an error)
        await page.goto('/login?error=auth_failed');

        // Then the error banner is shown
        await expect(page.getByText(/authentication failed/i)).toBeVisible();
    });

    test('redirects to Keycloak and back to the dashboard on success', async ({
        page,
    }) => {
        // And the logged-out visitor is on the login page
        await page.goto('/login');
        await expect(
            page.getByRole('heading', { name: 'Form Builder' })
        ).toBeVisible();

        // When they sign in with Keycloak using the dev-realm admin user
        await loginAs(page, 'admin');

        // Then they land back on the dashboard, authenticated
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(page.getByText(/welcome/i)).toBeVisible();
    });
});
