import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const THEME_SWITCHER_TESTID = 'theme-switcher';

/**
 * Waits until Vue has hydrated the page.
 * @param page The Playwright page.
 */
export async function waitForHydration(page: Page): Promise<void> {
    await expect(page.getByTestId(THEME_SWITCHER_TESTID)).toBeAttached();
}
