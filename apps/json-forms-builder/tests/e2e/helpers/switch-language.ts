import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { waitForHydration } from './hydration';

export type LocaleCode = 'en' | 'de';

const LOCALE_SWITCHER_TOGGLE_TESTID = 'locale-switcher-toggle';

/**
 * Opens the locale dropdown and selects the option for the given code.
 *
 * @param page The Playwright page.
 * @param code The locale to switch to ('en' or 'de').
 */
export async function switchLanguage(
    page: Page,
    code: LocaleCode
): Promise<void> {
    await waitForHydration(page);

    const toggle = page.getByTestId(LOCALE_SWITCHER_TOGGLE_TESTID);
    await expect(toggle).toBeVisible();

    const option = page.getByTestId(`locale-option-${code}`);

    await toggle.click();

    // The dropdown menu is rendered in the DOM but hidden until it opens —
    // wait for the option to become visible before clicking it.
    await expect(option).toBeVisible();
    await option.click();
}
