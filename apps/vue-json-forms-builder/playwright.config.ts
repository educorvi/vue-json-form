import { defineConfig, devices } from '@playwright/test';
import { storageStateFor } from './tests/e2e/setup/login-helper';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export const DEFAULT_TEST_USER = 'admin'; // Keycloak username `

export default defineConfig({
    testDir: './tests/e2e',
    outputDir: './test-results/e2e',
    // Wipes the test database (re-seeds the Keycloak users) before every
    // run — see tests/e2e/setup/global-setup.ts.
    globalSetup: './tests/e2e/setup/global-setup.ts',
    // Wipes the database again after every run, so no leftover data
    // (groups/forms created by parallel workers) pollutes the DB between
    // runs — see tests/e2e/setup/global-teardown.ts.
    globalTeardown: './tests/e2e/setup/global-teardown.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
        ? [
              ['list'],
              ['github'],
              ['junit', { outputFile: 'test-results/junit.xml' }],
              ['html', { open: 'never' }],
          ]
        : 'html',

    use: {
        baseURL,
        trace: 'retain-on-first-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            // Logs in every Keycloak realm user once (see `E2E_USERS` in
            // server/db/seed/users-constants.ts) and saves each session
            // cookie to disk — unless the stored session is still valid,
            // in which case the login is skipped entirely (local-dev
            // speed-up; see tests/e2e/setup/auth.setup.ts). Other
            // projects depend on this so most tests can skip the login
            // flow — see https://playwright.dev/docs/auth. Tests that
            // need another user switch via
            // `test.use({ storageState: storageStateFor(user) })`
            // (tests/e2e/setup/login-helper.ts).
            name: 'setup',
            testMatch: /setup\/auth\.setup\.ts/,
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Default session: the `admin` user (Keycloak username
                // `test`) — written by auth.setup.ts via storageStateFor().
                storageState: storageStateFor('admin'),
            },
            dependencies: ['setup'],
        },
    ],
});
