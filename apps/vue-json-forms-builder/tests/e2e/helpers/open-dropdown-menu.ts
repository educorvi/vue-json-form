import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

/**
 * Opens a dropdown menu (a `BDropdown` toggle button + its menu items)
 * and leaves it open.
 *
 * @param toggle The dropdown toggle button.
 * @param menuItem Any item inside the menu — used to detect "menu is open".
 * @param options `timeout` in ms (default 5000).
 */
export async function openDropdownMenu(
    toggle: Locator,
    menuItem: Locator,
    options: { timeout?: number } = {}
): Promise<void> {
    const { timeout = 5000 } = options;

    await expect
        .poll(
            async () => {
                if (await menuItem.isVisible().catch(() => false)) {
                    return true;
                }
                // Menu is closed — open it, then give it a beat to appear
                // before this poll returns (so the next iteration doesn't
                // click the toggle again while the menu is animating open
                // and close it).
                await toggle.click().catch(() => {});
                await menuItem
                    .waitFor({ state: 'visible', timeout: 1000 })
                    .catch(() => {});
                return menuItem.isVisible().catch(() => false);
            },
            { timeout }
        )
        .toBe(true);
}
