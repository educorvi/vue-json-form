import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { clickUntil } from './click-until';

const USER_PROFILE_TOGGLE_TESTID = 'user-profile-toggle';
const THEME_SWITCHER_TESTID = 'theme-switcher';

/**
 * Opens the user-profile dropdown from the header (idempotent).
 *
 * The dropdown uses `:auto-close="false"`, so the toggle toggles the menu
 * open/closed — clicking it when already open would CLOSE it. Only click
 * when the menu is actually closed.
 *
 * BV-next can silently drop a toggle click while its internals are still
 * settling (pre-hydration or mid-mount), so `clickUntil` retries the
 * click until the menu is actually open — an outcome check.
 *
 * @param page The Playwright page.
 */
export async function openUserProfile(page: Page): Promise<void> {
    const toggle = page.getByTestId(USER_PROFILE_TOGGLE_TESTID);
    await expect(toggle).toBeVisible();

    // The theme switcher lives inside the dropdown menu — when it is
    // visible, the menu is open.
    const switcher = page.getByTestId(THEME_SWITCHER_TESTID);

    await clickUntil(toggle, () => switcher.isVisible().catch(() => false));
}
