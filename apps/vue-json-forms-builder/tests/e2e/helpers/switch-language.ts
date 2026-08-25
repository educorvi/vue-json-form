import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { clickUntil } from './click-until';

export type LocaleCode = 'en' | 'de';

const LOCALE_SWITCHER_TOGGLE_TESTID = 'locale-switcher-toggle';

const LOCALE_NAMES: Record<LocaleCode, string> = {
    en: 'English',
    de: 'Deutsch',
};

/**
 * Switches the app locale to the given code.
 *
 * The switcher is SSR-rendered, so the toggle is visible BEFORE Vue
 * hydrates — a click before that is silently dropped. The dropdown menu
 * also closes on outside mousedown, so a naive "open menu, click option"
 * sequence can race the menu closing. This can't use `clickUntil`'s plain
 * fixed-target form because *which* element needs clicking depends on
 * menu state, so it supplies a click-action function instead:
 *  1. if the option is not visible the menu is closed — click the TOGGLE
 *     to open it, and
 *  2. if it is visible, click the OPTION, until the toggle's label shows
 *     the target locale (an outcome check, same pattern as `switchTheme`).
 *
 * @param page The Playwright page.
 * @param code The locale to switch to ('en' or 'de').
 */
export async function switchLanguage(
    page: Page,
    code: LocaleCode
): Promise<void> {
    const toggle = page.getByTestId(LOCALE_SWITCHER_TOGGLE_TESTID);
    const option = page.getByTestId(`locale-option-${code}`);
    await expect(toggle).toBeVisible();

    await clickUntil(
        async () => {
            if (!(await option.isVisible())) {
                // Menu closed (or not yet opened) — open it.
                await toggle.click({ force: true }).catch(() => {});
                return;
            }
            // `force: true` — when the locale changes, the dropdown
            // re-renders (the active item moves), which can keep the
            // option unstable for a normal click (Playwright waits for
            // actionability). The outcome check still verifies the click
            // actually landed.
            await option.click({ force: true }).catch(() => {});
            // `setLocale` updates asynchronously — give Vue a beat to
            // flush the re-render before the next outcome check.
            await page.waitForTimeout(50);
        },
        async () =>
            (await toggle.textContent())?.trim() === LOCALE_NAMES[code],
        { timeout: 5000 }
    );
}
