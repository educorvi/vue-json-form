import { test, expect } from '@playwright/test';

test.describe('My First Test', () => {
    test('visits the app root url', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('main > h2:first-child')).toContainText(
            'VJF Demo'
        );
    });
});
