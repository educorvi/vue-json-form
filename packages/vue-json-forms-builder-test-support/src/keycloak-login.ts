import { expect, type Page } from '@playwright/test';

export interface KeycloakLoginOptions {
    /** Keycloak base URL to assert the redirect lands on, e.g. HOSTS.kc1 or HOSTS.externalKeycloak. */
    keycloakBaseUrl: string;
    username: string;
    password: string;
    /** Path/URL to navigate to before starting the login flow (e.g. '/login'). */
    startUrl: string;
    /** Accessible name of the control that starts the Keycloak redirect. */
    signInControlName?: RegExp | string;
    /** URL pattern the page should land on after a successful login. */
    landedUrlPattern: RegExp;
}

/**
 * Generic real Keycloak login flow
 */
export async function loginViaKeycloak(
    page: Page,
    opts: KeycloakLoginOptions
): Promise<void> {
    await page.goto(opts.startUrl);

    const signInControl = opts.signInControlName ?? /sign in with keycloak/i;
    const link = page.getByRole('link', { name: signInControl });
    if (await link.count()) {
        await link.click();
    } else {
        await page.getByRole('button', { name: signInControl }).click();
    }

    const realmOrigin = new URL(opts.keycloakBaseUrl).origin.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
    );
    await expect(page).toHaveURL(new RegExp(`^${realmOrigin}/realms/`));

    await page.getByLabel(/username or email/i).fill(opts.username);
    await page.getByLabel('Password', { exact: true }).fill(opts.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.waitForURL(opts.landedUrlPattern);
}

/**
 * Starts watching `page` for a TOP-LEVEL navigation into the given
 * Keycloak's login UI (`/realms/*`). Used to prove FULLY silent SSO (no
 * redirect at all, e.g. `onLoad: 'check-sso'` finding an existing session):
 * call this BEFORE the action expected to authenticate transparently, then
 * assert `wasShown()` is false.
 *
 * NOT the right check when a top-level redirect through Keycloak is
 * itself expected and fine — e.g. clicking a "Sign in" fallback button,
 * which legitimately bounces through Keycloak's `/realms/.../auth`
 * endpoint even when it then brokers straight through an already-
 * authenticated identity provider with no user interaction. For that case
 * use `watchForKeycloakCredentialPrompt` instead, which checks whether the
 * user was actually asked to type credentials, not just whether Keycloak
 * appeared in the URL bar.
 *
 * Only the main frame counts: silent `check-sso` legitimately loads
 * `/realms/.../protocol/openid-connect/auth?prompt=none` in a hidden
 * `<iframe>` (see keycloak-js) — that's the mechanism SSO working looks
 * like, not a prompt, so iframe navigations are ignored here.
 */
// export function watchForKeycloakLoginPrompt(
//     page: Page,
//     keycloakBaseUrl: string
// ): { wasShown: () => boolean } {
//     const realmOrigin = new URL(keycloakBaseUrl).origin;
//     let shown = false;
//     page.on('framenavigated', (frame) => {
//         if (
//             frame === page.mainFrame() &&
//             frame.url().startsWith(`${realmOrigin}/realms/`)
//         ) {
//             shown = true;
//         }
//     });
//     return { wasShown: () => shown };
// }

/**
 * Starts watching `page` for an INTERACTIVE Keycloak credential form
 * (the username/email + password fields `loginViaKeycloak` fills in)
 * actually being rendered at `keycloakBaseUrl`. Unlike
 * `watchForKeycloakLoginPrompt`, a top-level bounce through Keycloak's own
 * URLs does NOT count by itself — only the user being asked to type
 * credentials does. Use this for a "sign in via a broker, falling back to
 * a real redirect is fine, but the user must not need a session or
 * credentials at THIS Keycloak" scenario.
 *
 * Polls in the background (Keycloak's login form is always a real
 * top-level page — `login()` does a full `window.location.assign`, never
 * an iframe — so no frame-tracking is needed, just `page.url()` +
 * `getByLabel`).
 */
export function watchForKeycloakCredentialPrompt(
    page: Page,
    keycloakBaseUrl: string
): { wasShown: () => boolean } {
    const realmOrigin = new URL(keycloakBaseUrl).origin;
    let shown = false;

    (async () => {
        while (!shown && !page.isClosed()) {
            if (page.url().startsWith(`${realmOrigin}/`)) {
                shown = await page
                    .getByLabel(/username or email/i)
                    .isVisible()
                    .catch(() => false);
            }
            await page.waitForTimeout(100).catch(() => {});
        }
    })();

    return { wasShown: () => shown };
}
