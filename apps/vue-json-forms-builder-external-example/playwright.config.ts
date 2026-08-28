import { defineConfig, devices } from '@playwright/test';

/**
 * Full-stack e2e — needs the real docker-compose `ci` profile stack
 * running (see apps/vue-json-forms-builder/docker-compose.yaml).
 */
const baseURL =
    process.env.PLAYWRIGHT_BASE_URL ??
    'http://external-example-app.localhost:3001';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
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
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
