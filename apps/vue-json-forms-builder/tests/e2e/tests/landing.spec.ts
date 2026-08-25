import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { switchLanguage } from '../helpers/switch-language';
import { assertThemeAppearance, switchTheme } from '../helpers/switch-theme';
import de from '../../../i18n/locales/de.json' with { type: 'json' };
import en from '../../../i18n/locales/en.json' with { type: 'json' };

// helpers
const LANDING_PAGE_HEADING = 'Vue Json Form Builder';

async function assertLandingPageIsShown(page: Page) {
    // Then the landing page is shown
    await expect(
        page.getByRole('heading', { name: LANDING_PAGE_HEADING })
    ).toBeVisible();
}

/**
 * Given A logged-out visitor
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Landing Page', () => {
    test('renders the landing page on url root', async ({ page }) => {
        // When: A logged-out visitor opens the root url of the app
        await page.goto('/');

        // Then the landing page is shown
        await assertLandingPageIsShown(page);
    });

    test('the user can log in from the landing page', async ({ page }) => {
        // And the logged-out visitor is on the landing page
        await page.goto('/');
        await assertLandingPageIsShown(page);

        // When they click the login button
        await page.getByTestId('dashboard-login-button').click();

        // Then they are redirected to Keycloak
        await expect(page).toHaveURL(/\/realms\/dev/);
    });

    test('the user can switch the language', async ({ page }) => {
        // And the logged-out visitor is on the landing page
        await page.goto('/');
        await assertLandingPageIsShown(page);

        // When they switch the language to German
        await switchLanguage(page, 'de');

        // Then the subtitle is shown in German (compared against the app's
        // own locale file on purpose — here we only test that the switch
        // works, not the copy itself)
        await expect(page.getByText(de.landing.subtitle)).toBeVisible();

        // When they switch the language back to English
        await switchLanguage(page, 'en');

        // Then the subtitle is shown in English again
        await expect(page.getByText(en.landing.subtitle)).toBeVisible();
    });

    test('the user can switch the theme', async ({ page }) => {
        // And the logged-out visitor is on the landing page
        await page.goto('/');
        await assertLandingPageIsShown(page);

        // When they switch the theme to dark
        await switchTheme(page, 'Dark');

        // Then dark mode is applied
        await assertThemeAppearance(page, 'Dark');

        // When they switch back to light
        await switchTheme(page, 'Light');

        // Then light mode is applied again
        await assertThemeAppearance(page, 'Light');
    });
});
