import { test as setup } from '@playwright/test';
import { isStoredSessionValid, loginAs, storageStateFor } from './login-helper';
import { USER_TYPE_LIST } from '../../../server/seed/users-constants';

/**
 * Authenticates every Keycloak realm user once and persists each session cookie, so the rest of the suite can switch
 * users via `test.use({ storageState: storageStateFor('user2') })` without repeating the login flow (see https://playwright.dev/docs/auth).
 *
 * A stored session that is still valid is reused as-is and the Keycloak login is skipped entirely.
 */

const canReuseStoredSessions =
    !process.env.CI && process.env.PW_FORCE_LOGIN !== '1';

for (const user of USER_TYPE_LIST) {
    setup(`authenticate as ${user}`, async ({ page }) => {
        if (canReuseStoredSessions && (await isStoredSessionValid(user))) {
            // The stored session cookie still works — keep the existing
            // storage-state file, no (slow) Keycloak login needed.
            return;
        }

        // Given the dev-realm user exists
        // When they sign in via Keycloak
        await loginAs(page, user);

        // Then the session cookie is persisted for the rest of the suite
        await page.context().storageState({
            path: storageStateFor(user),
        });
    });
}
