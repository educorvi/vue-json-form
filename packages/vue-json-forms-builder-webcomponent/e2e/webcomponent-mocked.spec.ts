import { test, expect } from '@playwright/test';
import { builderLocators } from '@educorvi/vue-json-forms-builder-test-support/locators';

/**
 * PoC — the real <vue-json-form-builder> custom element (registered by main.ce.ts, see main.dev.ts)
 */

const NAME_JSON_SCHEMA = JSON.stringify({
    type: 'object',
    properties: { name: { type: 'string', title: 'Name' } },
});
const NAME_UI_SCHEMA = JSON.stringify({
    version: '2.0',
    layout: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/name' }],
    },
});

test.describe('<vue-json-form-builder> custom element (mocked, no backend)', () => {
    test('renders with the header visible by default', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('vue-json-form-builder')).toBeVisible();
        await expect(builderLocators(page).header()).toBeVisible();
    });

    test('hide-header attribute hides the header', async ({ page }) => {
        await page.goto('/?hideHeader=1');
        await expect(page.locator('vue-json-form-builder')).toBeVisible();
        await expect(builderLocators(page).header()).toHaveCount(0);
    });

    test('renders canvas content from json-schema/ui-schema attributes', async ({
        page,
    }) => {
        await page.goto(
            `/?jsonSchema=${encodeURIComponent(NAME_JSON_SCHEMA)}&uiSchema=${encodeURIComponent(NAME_UI_SCHEMA)}`
        );
        await expect(
            builderLocators(page).canvasElementsByType('string')
        ).toBeVisible();
    });

    test('emits vjfb-change as a real DOM CustomEvent on the element', async ({
        page,
    }) => {
        // Registered via addInitScript so it's attached before the app
        // mounts and dispatches — capture:true catches it regardless of
        // whether the custom event bubbles.
        await page.addInitScript(() => {
            (window as unknown as { __vjfbEvents: unknown[] }).__vjfbEvents =
                [];
            window.addEventListener(
                'vjfb-change',
                (e) => {
                    (
                        window as unknown as { __vjfbEvents: unknown[] }
                    ).__vjfbEvents.push((e as CustomEvent).detail);
                },
                true
            );
        });

        await page.goto(
            `/?jsonSchema=${encodeURIComponent(NAME_JSON_SCHEMA)}&uiSchema=${encodeURIComponent(NAME_UI_SCHEMA)}`
        );

        await expect
            .poll(
                () =>
                    page.evaluate(
                        () =>
                            (
                                window as unknown as {
                                    __vjfbEvents: unknown[];
                                }
                            ).__vjfbEvents.length
                    ),
                { timeout: 5000 }
            )
            .toBeGreaterThan(0);

        const events = await page.evaluate(
            () =>
                (window as unknown as { __vjfbEvents: unknown[][] })
                    .__vjfbEvents
        );
        const [lastJsonSchema] = events[events.length - 1] as [
            Record<string, unknown>,
            Record<string, unknown>,
        ];
        expect(lastJsonSchema).toMatchObject({
            properties: { name: { type: 'string' } },
        });
    });
});
