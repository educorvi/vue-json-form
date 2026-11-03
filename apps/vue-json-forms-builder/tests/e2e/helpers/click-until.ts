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
 * `clickTarget` can be a fixed `Locator` (clicked the same way every
 * retry), or a click-action function for interactions where *which*
 * element to click depends on current state (e.g. a dropdown: click the
 * toggle while closed, click an option once open).
 *
 * @param clickTarget The element to click, or a function that performs
 *   the click itself (called repeatedly).
 * @param isDone Predicate that observes the outcome of the click.
 * @param options `timeout` in ms (default 10000), `clickTimeout` in ms per
 *   click attempt (default 3000), `message` for failures.
 */
export async function clickUntil(
    clickTarget: Locator | (() => void | Promise<void>),
    isDone: () => boolean | Promise<boolean>,
    options: {
        timeout?: number;
        clickTimeout?: number;
        message?: string;
    } = {}
): Promise<void> {
    // 10s default: on CI the "click → hydrate → handler runs → outcome"
    // round-trip is comfortably slower than the old 5s (see versions.spec
    // flakiness).
    const { timeout = 10000, clickTimeout = 3000, message } = options;
    const click = () =>
        typeof clickTarget === 'function'
            ? clickTarget()
            : clickTarget.click({ timeout: clickTimeout });

    let pendingAttempt: Promise<void> | undefined;

    const clickOnce = async (): Promise<void> => {
        if (pendingAttempt) return;

        const attempt = (async () => {
            try {
                await click();
            } catch {
                // Not clickable yet / already gone (pre-hydration, detached, own deadline hit) — the poll simply tries again.
            }
        })();
        pendingAttempt = attempt;
        void attempt.finally(() => {
            if (pendingAttempt === attempt) pendingAttempt = undefined;
        });

        await Promise.race([attempt, sleep(clickTimeout)]);
    };

    const intervals = [25, 50, 100, 250, 500];

    await expect
        .poll(
            async () => {
                if (await isDone()) {
                    return true;
                }
                await clickOnce();
                return false;
            },
            { timeout, intervals, message }
        )
        .toBe(true);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
