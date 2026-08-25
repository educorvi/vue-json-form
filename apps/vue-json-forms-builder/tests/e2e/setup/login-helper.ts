import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, request } from '@playwright/test';
import {
    E2EUserTypes,
    E2E_USERS,
} from '../../../server/seed/users-constants';
import type { Page } from '@playwright/test';
// ── Session cookies (storage states) ─────────────────────────────────────────

/**
 * Playwright storage-state file for the given user's session cookie, created by tests/e2e/setup/auth.setup.ts. Use with:
 *
 *     test.describe('...', () => {
 *         test.use({ storageState: storageStateFor('user1') });
 *         test('...', async ({ page }) => { ... });
 *     });
 *
 * The default user's file is `.auth/test.json` (the `admin` user, Keycloak
 * username `test`) — that's also the storageState the `chromium` project
 * uses in playwright.config.ts.
 * The files live in tests/e2e/.auth/
 */
export function storageStateFor(user: E2EUserTypes) {
    const file = E2E_USERS[user].username;
    return fileURLToPath(new URL(`../.auth/${file}.json`, import.meta.url));
}

// ── Session reuse (local-dev speed-up) ───────────────────────────────────────

/**
 * True if the stored session cookie for `user` is still valid — checked by sending the saved `nuxt-session` cookie to the app's own session
 * endpoint (`GET /api/_auth/session`).
 */
export async function isStoredSessionValid(
    user: E2EUserTypes
): Promise<boolean> {
    const statePath = storageStateFor(user);
    if (!existsSync(statePath)) return false;

    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
    const context = await request.newContext({
        baseURL,
        storageState: statePath,
    });
    try {
        const response = await context.get('/api/_auth/session');
        if (!response.ok()) return false;

        const session = (await response.json()) as {
            user?: { id?: string };
        };
        // Identity check via the Keycloak `sub` (exposed as `user.id`):
        // `user.username` is NOT stable — the server sets it from
        // Keycloak's display-name claim (e.g. "Test User"), not the
        // login name.
        if (session.user?.id !== E2E_USERS[user].sub) return false;

        // Persist any cookie the server refreshed during the request.
        const state = JSON.parse(readFileSync(statePath, 'utf8')) as {
            cookies: unknown[];
        };
        state.cookies = (await context.storageState()).cookies;
        writeFileSync(statePath, JSON.stringify(state, null, 2));
        return true;
    } catch {
        return false;
    } finally {
        await context.dispose();
    }
}

// ── API keys (for seeding scenario data) ────────────────────────────────────

// 2. Precompile the shared provisioning modules (TypeORM + legacy decorators) to plain CJS — see build-provision.ts.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const compiledOutfile = new URL(
    '../../../.nuxt/e2e/provision.cjs',
    import.meta.url
).pathname;

/**
 * Typed oRPC client acting as the given REAL Keycloak e2e user (admin, user1, user3) — the same users the UI logs in as. Used to seed
 * scenario data at the API level
 *
 * Requires the global-setup to have run (it builds the compiled bundle).
 */
export async function apiClientFor(user: E2EUserTypes) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const e2eProvision = require(compiledOutfile);
    return e2eProvision.apiClientFor(user);
}

// ── Real Keycloak login flow ─────────────────────────────────────────────────

/**
 * Shared Keycloak login flow used.
 */
export async function loginAs(page: Page, user: E2EUserTypes): Promise<void> {
    // Given a logged-out browser on the login page
    await page.goto('/login');

    // When they choose to sign in with Keycloak
    await page.getByRole('link', { name: /sign in with keycloak/i }).click();
    await expect(page).toHaveURL(/\/realms\/dev\//);

    // And provide their dev-realm credentials
    const e2eUser = E2E_USERS[user];
    await page.getByLabel(/username or email/i).fill(e2eUser.username);
    await page.getByLabel('Password', { exact: true }).fill(e2eUser.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Then they land on the authenticated dashboard
    await page.waitForURL(/\/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
}
