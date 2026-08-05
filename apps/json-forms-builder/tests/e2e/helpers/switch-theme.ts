import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * the theme switcher values
 */
export type ThemeMode = 'Light' | 'Dark';

const THEME_SWITCHER_TESTID = 'theme-switcher';
const THEME_CYCLE_LENGTH = 3;

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
    await expect
        .poll(() =>
            page.evaluate(() => getComputedStyle(document.body).backgroundColor)
        )
        .toBe(THEME_BODY_COLORS[mode]);
}

/**
 * Clicks the theme switcher until the desired mode is active.
 * @param page The Playwright page.
 * @param target The theme mode to switch to.
 */
export async function switchTheme(
    page: Page,
    target: ThemeMode
): Promise<void> {
    const switcher = page.getByTestId(THEME_SWITCHER_TESTID);
    await expect(switcher).toBeVisible();

    for (let click = 0; click < THEME_CYCLE_LENGTH; click++) {
        const mode = (await switcher.textContent())?.trim();
        if (mode === target) {
            break;
        }
        await switcher.click();
    }

    const current = (await switcher.textContent())?.trim();
    if (current !== target) {
        throw new Error(
            `switchTheme(): expected theme "${target}" after at most ${THEME_CYCLE_LENGTH} clicks, but the switcher ended on "${current}" `
        );
    }
}
