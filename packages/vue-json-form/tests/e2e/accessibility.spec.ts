import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Check for accessibility issues', () => {
    const axeOptions = {
        rules: {
            'page-has-heading-one': { enabled: false },
        },
    };

    test('Showcase', async ({ page }) => {
        await page.goto('http://localhost:5173/showcase?nonav=true');
        // Wait for page to render
        expect(await page.locator('input').count()).toBeGreaterThan(0);
        const accessibilityScanResults = await new AxeBuilder({ page })
            .options(axeOptions)
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Reproduce', async ({ page }) => {
        await page.goto('http://localhost:5173/reproduce?nonav=true');
        // Wait for page to render
        expect(await page.locator('input').count()).toBeGreaterThan(0);
        const accessibilityScanResults = await new AxeBuilder({ page })
            .options(axeOptions)
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });
});
