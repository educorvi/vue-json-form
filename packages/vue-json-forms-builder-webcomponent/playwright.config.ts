import { defineConfig, devices } from '@playwright/test';

const port = 5173;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

/**
 * Mocked browser tests. Test the real <vue-json-form-builder> custom element against the dev playground (src/App.vue + src/main.dev.ts, which registers it exactly
 * like the production build does — see main.dev.ts).
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? [['list'], ['github']] : 'html',

    use: {
        baseURL,
        trace: 'retain-on-first-failure',
        screenshot: 'only-on-failure',
    },

    webServer: {
        command: `yarn dev:internal --port ${port} --strictPort`,
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
