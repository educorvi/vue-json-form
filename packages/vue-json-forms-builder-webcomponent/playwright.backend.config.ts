import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

if (!process.env.E2E_BACKEND_URL) {
    throw new Error(
        'E2E_BACKEND_URL is required for `yarn test:e2e` in this package: these specs drive a real Keycloak login against the backend'
    );
}

export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.backend.spec.ts',
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI
        ? [
              ['list'],
              ['github'],
              ['junit', { outputFile: 'test-results/junit-backend.xml' }],
              ['html', { open: 'never' }],
          ]
        : 'html',

    use: {
        baseURL,
        trace: 'retain-on-first-failure',
        screenshot: 'only-on-failure',
    },

    webServer: {
        command: `yarn dev:internal --port ${process.env.PLAYWRIGHT_PORT ?? 5173} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
