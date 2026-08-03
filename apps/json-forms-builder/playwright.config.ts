import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
    testDir: './tests/e2e',
    outputDir: './test-results/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? [['list'], ['github']] : 'html',

    use: {
        baseURL,
        trace: 'retain-on-first-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            // Logs in once via the real Keycloak flow and saves the
            // resulting session cookie to disk. Other projects depend on
            // this so most tests can skip the (slower) login flow — see
            // https://playwright.dev/docs/auth
            name: 'setup',
            testMatch: /.*\.setup\.ts/,
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: fileURLToPath(
                    new URL('./tests/e2e/.auth/user.json', import.meta.url)
                ),
            },
            dependencies: ['setup'],
        },
    ],
});
