import { test, expect } from '@playwright/test';

/**
 * Given A logged-out visitor
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('API docs', () => {
    test('open api specification is served', async ({ request }) => {
        // When: The user opens the openapi specification url
        const response = await request.get('/api/v1/spec.json');

        // Then the openapi specification is served with the api title
        expect(response.ok()).toBeTruthy();
        const spec = await response.json();
        expect(spec.info.title).toBe('Form Builder API');
    });

    test('scalar docs are served', async ({ page }) => {
        // When: The user opens the scalar docs url
        await page.goto('/api/v1/scalar');

        // Then the scalar ui is rendered with the api title
        await expect(page.getByText('Form Builder API')).toBeVisible();
        await expect(page.getByText('Developer Tools')).toBeVisible();
    });

    test('swagger docs are served', async ({ page }) => {
        // When: The user opens the swagger docs url
        await page.goto('/api/v1/swagger');

        // Then the swagger ui is rendered with the api title
        await expect(page.getByText('Form Builder API')).toBeVisible();
        await expect(
            page.getByRole('button', { name: /Authorize/i })
        ).toBeVisible();
    });
});
