import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { switchLanguage } from '../helpers/switch-language';

import { waitForHydration } from '../helpers/hydration';
import { assertThemeAppearance, switchTheme } from '../helpers/switch-theme';
import { DEFAULT_TEST_USER } from '../../../playwright.config';
import { E2E_USERS } from '../../../server/db/seed/users-constants';
import de from '../../../i18n/locales/de.json' with { type: 'json' };
import en from '../../../i18n/locales/en.json' with { type: 'json' };
// The default `chromium` project is authenticated as the seeded admin user
// (Keycloak username `test`, display name "Test User") — see the storageState
// in playwright.config.ts.

const PROFILE_USERNAME = E2E_USERS[DEFAULT_TEST_USER].name;

/**
 * Opens the user-profile dropdown from the header.
 *
 * The toggle is server-rendered, so it's clickable before Vue has hydrated —
 * but bootstrap-vue-next silently drops clicks on dropdowns while unmounted
 * (`useShowHide.show()` bails when `!isMounted`), so wait for hydration
 * before clicking the toggle (see waitForHydration).
 *
 * @param page The Playwright page.
 */
async function openUserProfile(page: Page): Promise<void> {
    const toggle = page.getByRole('button', { name: PROFILE_USERNAME });
    await expect(toggle).toBeVisible();

    await waitForHydration(page);

    await toggle.click();
    await expect(page.getByTestId('theme-switcher')).toBeVisible();
}

test.describe('User Profile', () => {
    test('the user can switch the theme', async ({ page }) => {
        // Given the logged-in user is on the dashboard
        await page.goto('/dashboard');

        // When they open the user-profile dropdown
        await openUserProfile(page);

        // And they switch the theme to dark
        await switchTheme(page, 'Dark');

        // Then dark mode is applied
        await assertThemeAppearance(page, 'Dark');

        // When they switch back to light
        await switchTheme(page, 'Light');

        // Then light mode is applied again
        await assertThemeAppearance(page, 'Light');
    });

    test('the user can switch the language', async ({ page }) => {
        // Given the logged-in user is on the dashboard
        await page.goto('/dashboard');

        // When they open the user-profile dropdown
        await openUserProfile(page);

        // And they switch the language to German
        await switchLanguage(page, 'de');

        // Then the dashboard description is shown in German
        await expect(
            page.getByText(de.dashboard.welcomeDescription)
        ).toBeVisible();

        // When they switch the language back to English
        await switchLanguage(page, 'en');

        // Then the dashboard description is shown in English again
        await expect(
            page.getByText(en.dashboard.welcomeDescription)
        ).toBeVisible();
    });

    test('the user can log out', async ({ page }) => {
        // Given the logged-in user is on the dashboard
        await page.goto('/dashboard');

        // When they open the user-profile dropdown
        await openUserProfile(page);

        // And click the sign-out item
        await page.getByRole('menuitem', { name: /sign out/i }).click();

        // Then they are logged out and redirected to the landing page
        await expect(page).toHaveURL(/\/$/);
        await expect(
            page.getByRole('heading', { name: 'Vue Json Form Builder' })
        ).toBeVisible();
    });
});
