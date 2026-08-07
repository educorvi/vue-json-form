import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { clickUntil } from './click-until';

export type LocaleCode = 'en' | 'de';

const LOCALE_SWITCHER_TOGGLE_TESTID = 'locale-switcher-toggle';

/**
 * Opens the locale dropdown and selects the option for the given code.
 *
 * The dropdown toggle click is only effective once Vue has hydrated (a
 * click before that is silently dropped) — `clickUntil` retries the
 * click until the option is actually visible (an outcome check).
 *
 * @param page The Playwright page.
 * @param code The locale to switch to ('en' or 'de').
 */
export async function switchLanguage(
    page: Page,
    code: LocaleCode
): Promise<void> {
    const toggle = page.getByTestId(LOCALE_SWITCHER_TOGGLE_TESTID);
    await expect(toggle).toBeVisible();

    const option = page.getByTestId(`locale-option-${code}`);

    // The dropdown menu is rendered in the DOM but hidden until it opens —
    // keep clicking the toggle until the option becomes visible.
    await clickUntil(toggle, () => option.isVisible().catch(() => false));

    await option.click();
}
