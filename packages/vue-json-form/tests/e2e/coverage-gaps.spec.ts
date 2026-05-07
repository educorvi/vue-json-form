import { test, expect, type Page } from '@playwright/test';

const MULTIPLE_URL = 'http://localhost:5173/multiple?nonav=true';
const REPRODUCE_URL = 'http://localhost:5173/reproduce?nonav=true';
const WIZARD_URL = 'http://localhost:5173/wizard';
const CUSTOM_SCHEMA_URL = 'http://localhost:5173/custom-schema?nonav=true';

const customJsonSchema = JSON.stringify({
    $schema: 'https://json-schema.org/draft/2019-09/schema#',
    type: 'object',
    properties: {
        name: {
            type: 'string',
            title: 'Name',
        },
    },
    required: ['name'],
});

const customUiSchema = JSON.stringify({
    $schema: 'https://educorvi.github.io/vue-json-form/schemas/ui.schema.json',
    version: '2.0',
    layout: {
        type: 'VerticalLayout',
        elements: [
            {
                type: 'Control',
                scope: '/properties/name',
            },
            {
                type: 'Buttongroup',
                buttons: [
                    {
                        type: 'Button',
                        buttonType: 'submit',
                        text: 'Submit',
                        options: {
                            variant: 'primary',
                        },
                    },
                ],
            },
        ],
    },
});

const invalidVersionUiSchema = JSON.stringify({
    $schema: 'https://educorvi.github.io/vue-json-form/schemas/ui.schema.json',
    version: '1.0',
    layout: {
        type: 'VerticalLayout',
        elements: [
            {
                type: 'Control',
                scope: '/properties/name',
            },
        ],
    },
});

async function readJsonResult(page: Page) {
    const resultText = await page.locator('#result-container').textContent();
    return JSON.parse(resultText || '{}');
}

async function applyCustomSchemas(page: Page, jsonSchema: string, uiSchema: string) {
    await page.locator('#json-text-input').fill(jsonSchema);
    await page.locator('#ui-text-input').fill(uiSchema);
    await page.getByRole('button', { name: 'Apply & Show Form' }).click();
}

test.describe('Coverage gaps', () => {
    test('multiple forms keep validation state and values isolated', async ({
        page,
    }) => {
        await page.goto(MULTIPLE_URL);

        const showcaseForm = page.locator('form#showcase-form');
        const reproduceForm = page.locator('form#reproduce-form');
        const showcaseName = showcaseForm.locator(
            '#vjf_control_for__properties_name'
        );
        const reproducePattern = reproduceForm.locator(
            'input[name="/properties/patternString"]'
        );

        await showcaseName.fill('Showcase User');
        await reproducePattern.fill('mystring-abc');

        await showcaseForm
            .getByRole('button', { name: 'Submit', exact: true })
            .click();

        await expect(showcaseForm).toHaveClass(/was-validated/);
        await expect(reproduceForm).not.toHaveClass(/was-validated/);
        await expect(showcaseName).toHaveValue('Showcase User');
        await expect(reproducePattern).toHaveValue('mystring-abc');
    });

    test('sleep submit shows a loading spinner and recovers afterwards', async ({
        page,
    }) => {
        await page.goto(REPRODUCE_URL);

        const sleepSubmitButton = page.locator('button.btn-warning');
        const consoleSubmitButton = page.locator('button.btn-info');

        await expect(sleepSubmitButton).toContainText('Submit to sleep');
        await sleepSubmitButton.click();

        await expect(
            sleepSubmitButton.locator('.spinner-border, .spinner-grow')
        ).toBeVisible();
        await expect(
            consoleSubmitButton.locator('.spinner-border, .spinner-grow')
        ).toHaveCount(0);

        await expect(page.locator('#result-container')).toBeVisible({
            timeout: 5000,
        });
        await expect(sleepSubmitButton).toContainText('Submit to sleep');
    });

    test('wizard removes hidden conditional values from the submitted payload', async ({
        page,
    }) => {
        await page.goto(WIZARD_URL);

        const nameInput = page.locator(
            'input[name="/properties/personalData/properties/name"]'
        );
        const ageInput = page.locator(
            'input[name="/properties/personalData/properties/age"]'
        );
        const guardianCheckbox = page.locator(
            'input[name="/properties/personalData/properties/guardianAgrees"]'
        );
        const messageField = page.locator(
            'textarea[name="/properties/message/properties/yourMessage"]'
        );
        const parentsContainer = page.locator(
            '[name="/properties/message/properties/parents"]'
        );

        await nameInput.fill('Jamie Example');
        await ageInput.fill('16');
        await guardianCheckbox.check();
        await page.getByRole('button', { name: 'Next' }).click();

        await messageField.fill('Minor message that should stay submitted');
        await expect(parentsContainer).toBeVisible();
        await parentsContainer.locator('button').click();
        await parentsContainer
            .locator('input[type="text"]')
            .first()
            .fill('Parent One');

        await page.getByRole('button', { name: 'Previous' }).click();
        await ageInput.fill('25');
        await expect(guardianCheckbox).not.toBeVisible();

        await page.getByRole('button', { name: 'Next' }).click();
        await expect(parentsContainer).not.toBeVisible();
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('button', { name: 'Submit' }).click();

        const result = await readJsonResult(page);
        expect(result.personalData).toEqual({
            name: 'Jamie Example',
            age: 25,
        });
        expect(result.message.parents).toBeUndefined();
        expect(result.message.yourMessage).toBe(
            'Minor message that should stay submitted'
        );
    });

    test('wizard progress only unlocks completed steps and allows navigation back', async ({
        page,
    }) => {
        await page.goto(WIZARD_URL);

        const progressButtons = page.locator('.wrappers-parent .stepWrapper button');

        await expect(progressButtons).toHaveCount(3);
        await expect(progressButtons.nth(0)).toBeDisabled();
        await expect(progressButtons.nth(1)).toBeDisabled();
        await expect(progressButtons.nth(2)).toBeDisabled();

        await page
            .locator('input[name="/properties/personalData/properties/name"]')
            .fill('Stepper User');
        await page.getByRole('button', { name: 'Next' }).click();

        await expect(progressButtons.nth(0)).toBeEnabled();
        await expect(progressButtons.nth(1)).toBeDisabled();
        await expect(progressButtons.nth(2)).toBeDisabled();

        await progressButtons.nth(0).click();

        await expect(
            page.locator('input[name="/properties/personalData/properties/name"]')
        ).toBeVisible();
        await expect(
            page.locator(
                'textarea[name="/properties/message/properties/yourMessage"]'
            )
        ).not.toBeVisible();
    });

    test('custom schema persists both schemas across a reload', async ({ page }) => {
        await page.goto(CUSTOM_SCHEMA_URL);
        await applyCustomSchemas(page, customJsonSchema, customUiSchema);

        const generatedNameInput = page.locator('input[name="/properties/name"]');

        await expect(generatedNameInput).toBeVisible();
        await generatedNameInput.fill('Persisted User');
        await page.getByRole('button', { name: 'Submit', exact: true }).click();
        await expect(page.locator('#result-container')).toContainText(
            'Persisted User'
        );

        await page.reload();

        await expect(page.locator('#json-text-input')).toHaveValue(customJsonSchema);
        await expect(page.locator('#ui-text-input')).toHaveValue(customUiSchema);
        await expect(generatedNameInput).toBeVisible();
    });

    test('custom schema surfaces invalid ui schema version errors', async ({
        page,
    }) => {
        await page.goto(CUSTOM_SCHEMA_URL);
        await applyCustomSchemas(page, customJsonSchema, invalidVersionUiSchema);

        await expect(
            page.getByText('There were errors while rendering this form')
        ).toBeVisible();
        await expect(
            page.getByText('Invalid UI Schema Version', { exact: true })
        ).toBeVisible();
        await expect(
            page.getByText("supported version '2.2'")
        ).toBeVisible();
    });
});
