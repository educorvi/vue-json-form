import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { clickUntil } from './click-until';

/**
 * the theme switcher values
 */
export type ThemeMode = 'Light' | 'Dark';

const THEME_SWITCHER_TESTID = 'theme-switcher';

/**
 * The page background color per theme
 */
const THEME_BODY_COLORS: Record<Exclude<ThemeMode, 'System'>, string> = {
    Light: 'rgb(255, 255, 255)',
    Dark: 'rgb(33, 37, 41)',
};

const THEME_MODE_BOOTSTRAP_ATTRS: Record<
    Exclude<ThemeMode, 'System'>,
    string
> = {
    Light: 'light',
    Dark: 'dark',
};

/**
 * Asserts that the page actually shows the given theme
 * @param page The Playwright page.
 * @param mode The theme mode to assert.
 */
export async function assertThemeAppearance(
    page: Page,
    mode: ThemeMode
): Promise<void> {
    const theme = THEME_MODE_BOOTSTRAP_ATTRS[mode];
    await expect(page.locator('html')).toHaveAttribute('data-bs-theme', theme);
    // toHaveCSS auto-retries until the style actually matches (CSS
    // recalc happens asynchronously after the attribute change).
    await expect(page.locator('body')).toHaveCSS(
        'background-color',
        THEME_BODY_COLORS[mode]
    );
}

/**
 * Clicks the theme switcher until the desired mode is active.
 *
 * The switcher is SSR-rendered, so it is visible BEFORE Vue hydrates —
 * a click before that is silently dropped. `clickUntil` retries until
 * the switcher's own label shows the target mode (an outcome check).
 *
 * @param page The Playwright page.
 * @param target The theme mode to switch to.
 */
export async function switchTheme(
    page: Page,
    target: ThemeMode
): Promise<void> {
    const switcher = page.getByTestId(THEME_SWITCHER_TESTID);
    await expect(switcher).toBeVisible();

    await clickUntil(
        switcher,
        async () => (await switcher.textContent())?.trim() === target
    );
}
