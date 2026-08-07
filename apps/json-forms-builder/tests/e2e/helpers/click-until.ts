import { expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

/**
 * Click `clickTarget` repeatedly until `isDone()` returns true.
 *
 * Nuxt pages are server-rendered, so buttons/links are visible and clickable BEFORE Vue has hydrated. A click that lands pre-hydration is
 * silently dropped (no click handler attached yet — Vue's `@click` or BV-next's dropdown logic don't exist in the DOM yet).
 *
 * This makes the test self-healing: it needs no timing assumptions, is
 * fast when the app is fast, and fails with the timeout only when the
 * outcome genuinely never happens.
 *
 * @param clickTarget The element to click (clicked repeatedly).
 * @param isDone Predicate that observes the outcome of the click.
 * @param options `timeout` in ms (default 5000), `message` for failures.
 */
export async function clickUntil(
    clickTarget: Locator,
    isDone: () => boolean | Promise<boolean>,
    options: { timeout?: number; message?: string } = {}
): Promise<void> {
    const { timeout = 5000, message } = options;
    await expect
        .poll(
            async () => {
                if (await isDone()) {
                    return true;
                }
                // The click target may be detached mid-poll (e.g. after a
                // navigation) — a failed click is fine, we just retry.
                await clickTarget.click().catch(() => {});
                return false;
            },
            { timeout, message }
        )
        .toBe(true);
}
