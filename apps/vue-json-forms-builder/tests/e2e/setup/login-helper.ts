import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, request } from '@playwright/test';
import { E2EUserTypes, E2E_USERS } from '../../../server/seed/users-constants';
import {
    HOSTS,
    loginViaKeycloak,
} from '@educorvi/vue-json-forms-builder-test-support';
import type { Page } from '@playwright/test';
// ── Session cookies (storage states) ─────────────────────────────────────────

/**
 * Playwright storage-state file for the given user's session cookie, created by tests/e2e/setup/auth.setup.ts.
 *
 * Usage: test.use({ storageState: storageStateFor('user1') });
 */
export function storageStateFor(user: E2EUserTypes) {
    const file = E2E_USERS[user].username;
    return fileURLToPath(new URL(`../.auth/${file}.json`, import.meta.url));
}

// ── Session reuse (local-dev speed-up) ───────────────────────────────────────

/**
 * True if the stored session cookie for `user` is still valid — checked by sending the saved `nuxt-session` cookie to the app's own session endpoint (`GET /api/_auth/session`).
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

/**
 * Typed oRPC client acting as the given REAL Keycloak e2e user (admin, user2, user3) — the same users the UI logs in as. Used to seed scenario data at the API level.
 *
 * Imported lazily so worker processes only touch the DataSource (built from `process.env.DB_*`) when a spec actually seeds data.
 */
export async function apiClientFor(user: E2EUserTypes) {
    const { apiClientFor: provision } = await import('../../support/provision');
    return provision(user);
}

// ── Real Keycloak login flow ─────────────────────────────────────────────────

/**
 * Shared Keycloak login flow used, wrapping the generic `loginViaKeycloak` from the shared test-support package with this app's own start page / landing assertion.
 */
export async function loginAs(page: Page, user: E2EUserTypes): Promise<void> {
    const e2eUser = E2E_USERS[user];
    await loginViaKeycloak(page, {
        keycloakBaseUrl: HOSTS.kc1,
        username: e2eUser.username,
        password: e2eUser.password,
        startUrl: '/login',
        landedUrlPattern: /\/dashboard/,
    });
    await expect(page.getByText(/welcome/i)).toBeVisible();
}
