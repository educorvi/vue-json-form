import { test, expect } from '@playwright/test';
import { switchLanguage } from '../helpers/switch-language';

import { openUserProfile } from '../helpers/user-profile';
import { assertThemeAppearance, switchTheme } from '../helpers/switch-theme';
import de from '../../../i18n/locales/de.json' with { type: 'json' };
import en from '../../../i18n/locales/en.json' with { type: 'json' };
// The default `chromium` project is authenticated as the seeded admin user
// (Keycloak username `test`, display name "Test User") — see the storageState
// in playwright.config.ts.

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
