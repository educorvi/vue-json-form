import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

const reporter: PlaywrightTestConfig['reporter'] = [['list'], ['html']];

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? 'blob' : reporter,
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'retain-on-first-failure',
        screenshot: 'on-first-failure',
        video: {
            mode: 'retain-on-failure',
            size: { width: 1920, height: 1080 },
        },
        viewport: { width: 1920, height: 1080 },
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],

    webServer: {
        command: 'yarn dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
    },
});
