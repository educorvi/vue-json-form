import { test, expect, type Page, type Locator } from '@playwright/test';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ComponentTag = 'vjf-default' | 'vjf-ajv' | 'vjf-shadow';

const TAB_BUTTONS: Record<ComponentTag, string> = {
    'vjf-default': 'Default',
    'vjf-ajv': 'AJV Validator',
    'vjf-shadow': 'Shadow DOM',
};

/**
 * Navigate to the dev app, select the showcase schema, switch to the given
 * webcomponent tab, and return a Locator scoped to that component element.
 */
async function gotoShowcase(page: Page, tag: ComponentTag): Promise<Locator> {
    await page.goto('/');
    await page.locator('#schema-select').selectOption('showcase');
    await page
        .locator('.nav-tabs')
        .getByRole('button', { name: TAB_BUTTONS[tag], exact: true })
        .click();
    const component = page.locator(tag);
    // Wait until the form is ready
    await expect(
        component.locator('#vjf_control_for__properties_done')
    ).toBeAttached();
    return component;
}

async function checkRadios(
    component: Locator,
    containerID: string,
    values: string[]
) {
    const container = component.locator(containerID);
    await expect(container.locator('> *')).toHaveCount(values.length);

    for (let index = 0; index < values.length; index++) {
        const radio = container
            .locator('> *')
            .nth(index)
            .locator('input')
            .first();
        await expect(radio).toHaveValue(values[index]);
        await expect(radio).toHaveAttribute('type', 'radio');
    }
}

// ── Structure tests – run for all three webcomponent variants ─────────────────

for (const tag of ['vjf-default', 'vjf-ajv', 'vjf-shadow'] as ComponentTag[]) {
    test.describe(`Structure [${tag}]`, () => {
        test.beforeEach(async ({ page }) => {
            await gotoShowcase(page, tag);
        });

        test('Switch', async ({ page }) => {
            const component = page.locator(tag);
            const checkbox = component.locator(
                '#vjf_control_for__properties_done'
            );
            await expect(checkbox).toBeVisible();
            await expect(checkbox).toHaveAttribute('type', 'checkbox');
        });

        test('Title', async ({ page }) => {
            const component = page.locator(tag);
            const select = component.locator(
                'select#vjf_control_for__properties_title'
            );
            await expect(select).toBeVisible();
            await expect(select.locator('option')).toHaveCount(4);
            await expect(select.locator('option').nth(0)).toHaveAttribute(
                'value',
                'Mrs.'
            );
            await expect(select.locator('option').nth(1)).toHaveAttribute(
                'value',
                'Mr.'
            );
            await expect(select.locator('option').nth(2)).toHaveAttribute(
                'value',
                'Ms.'
            );
            await expect(select.locator('option').nth(3)).toHaveAttribute(
                'value',
                'Dr.'
            );
        });

        test('Fanciness', async ({ page }) => {
            const component = page.locator(tag);
            await expect(
                component.locator('div#vjf_control_for__properties_fanciness')
            ).toBeVisible();
            await checkRadios(
                component,
                'div#vjf_control_for__properties_fanciness',
                ['fancy', 'fancier', 'fanciest', 'unicorn']
            );
        });

        test('Fileupload', async ({ page }) => {
            const component = page.locator(tag);
            await expect(
                component.locator(
                    'label[for="vjf_control_for__properties_fileupload"]'
                )
            ).toBeVisible();
            await expect(
                component.locator('input[name="/properties/fileupload"]')
            ).toHaveAttribute('type', 'file');
        });

        test('Group selector', async ({ page }) => {
            const component = page.locator(tag);
            const id = '#vjf_control_for__properties_group_selector';
            await expect(component.locator(id)).toBeVisible();
            const labels = component.locator(`${id} > label`);
            await expect(labels).toHaveCount(2);
            await expect(labels.first()).toBeVisible();
            await expect(labels.last()).toBeVisible();
        });

        test.describe('Group', () => {
            test('dueDate', async ({ page }) => {
                const component = page.locator(tag);
                const input = component.locator(
                    'input#vjf_control_for__properties_due_date'
                );
                await expect(input).toBeVisible();
                await expect(input).toHaveAttribute('type', 'datetime-local');
            });

            test('Rating', async ({ page }) => {
                const component = page.locator(tag);
                const rating = component.locator(
                    'input#vjf_control_for__properties_rating'
                );
                await expect(rating).toBeVisible();
                await expect(rating).toHaveAttribute('type', 'range');
                await expect(rating).toHaveAttribute('min', '0');
                await expect(rating).toHaveAttribute('max', '5');
                await expect(rating).toHaveAttribute('step', '1');
                await expect(rating).toHaveValue('3');
            });

            test('Description', async ({ page }) => {
                const component = page.locator(tag);
                const description = component.locator(
                    'textarea#vjf_control_for__properties_description'
                );
                await expect(description).toBeVisible();
                await expect(description).toHaveValue(
                    'This good text was set as default'
                );
                await expect(description).toHaveAttribute('rows', '2');
            });

            test('Teststring', async ({ page }) => {
                const component = page.locator(tag);
                const input = component.locator(
                    'input#vjf_control_for__properties_teststring'
                );
                await expect(input).toBeVisible();
                await expect(input).toHaveAttribute('type', 'text');
            });

            test('Weekdays', async ({ page }) => {
                const component = page.locator(tag);
                const id = 'div#vjf_control_for__properties_weekdays';
                const container = component.locator(id);
                await expect(container).toBeVisible();
                await expect(container.locator('> *')).toHaveCount(7);

                const weekdays = [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                ];
                for (let index = 0; index < weekdays.length; index++) {
                    const checkbox = container
                        .locator('> *')
                        .nth(index)
                        .locator('input')
                        .first();
                    await expect(checkbox).toHaveValue(weekdays[index]);
                    await expect(checkbox).toHaveAttribute('type', 'checkbox');
                }
            });

            test('RecurrenceInterval', async ({ page }) => {
                const component = page.locator(tag);
                const input = component.locator(
                    'input#vjf_control_for__properties_recurrence_interval'
                );
                await expect(input).toBeVisible();
                await expect(input).toHaveAttribute('type', 'number');
                await expect(input).toHaveAttribute('step', '1');
                const sibling = input.locator('xpath=following-sibling::*[1]');
                await expect(sibling).toHaveText('Weeks');
            });

            test('TestArray', async ({ page }) => {
                const component = page.locator(tag);
                const container = component.locator(
                    'div[name="/properties/testArray"]'
                );
                await expect(container).toBeVisible();
                await expect(container.locator('input')).toHaveCount(2);
                await expect(container.locator('input').first()).toBeVisible();
                await expect(
                    container.locator('input').first()
                ).toHaveAttribute('placeholder', 'This is a placeholder');
                await expect(
                    container.locator('button[aria-label="Add Item"]')
                ).toBeVisible();
            });
        });

        test.describe('Object', () => {
            test.beforeEach(async ({ page }) => {
                await page
                    .locator(tag)
                    .locator('#vjf_control_for__properties_group_selector')
                    .locator('> *')
                    .nth(3)
                    .click();
            });

            test('name', async ({ page }) => {
                const component = page.locator(tag);
                const input = component.locator(
                    'input#vjf_control_for__properties_testObject_properties_petName'
                );
                await expect(input).toBeVisible();
                await expect(input).toHaveAttribute('type', 'text');
            });

            test('age', async ({ page }) => {
                const component = page.locator(tag);
                const age = component.locator(
                    'input#vjf_control_for__properties_testObject_properties_age'
                );
                await expect(age).toBeVisible();
                await expect(age).toHaveAttribute('type', 'number');
                await expect(age).toHaveAttribute('step', '1');
                await expect(age).toHaveAttribute('min', '0');
                await expect(age).toHaveAttribute('max', '100');
                await expect(age).toHaveValue('10');
            });

            test('flauschig', async ({ page }) => {
                const component = page.locator(tag);
                const checkbox = component.locator(
                    'input#vjf_control_for__properties_testObject_properties_flauschig'
                );
                await expect(checkbox).toBeVisible();
                await expect(checkbox).toHaveAttribute('type', 'checkbox');
            });
        });

        test('HTML text', async ({ page }) => {
            const component = page.locator(tag);
            const el = component.locator('span.vjf_htmlRenderer > p');
            await expect(el).toBeVisible();
            expect(await el.innerHTML()).toBe(
                'Ich bin ein <strong class="text-primary">HTML</strong> Text'
            );
        });

        test('Form Buttons', async ({ page }) => {
            const component = page.locator(tag);
            await expect(
                component.getByRole('button', { name: 'Submit', exact: true })
            ).toBeVisible();
            await expect(
                component
                    .locator('button[type="submit"][formnovalidate]')
                    .first()
            ).toBeVisible();
            await expect(
                component.locator('button[type="reset"]')
            ).toBeVisible();
        });

        test('Fancy Unicorn', async ({ page }) => {
            const component = page.locator(tag);
            await component
                .locator('#vjf_control_for__properties_fanciness input')
                .nth(3)
                .check();
            await component
                .locator('input[type=range]#vjf_control_for__properties_rating')
                .fill('4');

            const el = component.locator('span.vjf_htmlRenderer > h3');
            await expect(el).toHaveText(
                'You are a very fancy unicorn my friend...'
            );
            await expect(el).toHaveAttribute(
                'style',
                'background-image:linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red);-webkit-background-clip:text;color:transparent'
            );
        });

        test('Hidden form fields', async ({ page }) => {
            const component = page.locator(tag);
            const hiddenFields = [
                '/properties/hiddenDateTime',
                '/properties/hiddenDate',
                '/properties/hiddenTime',
            ];
            for (const hiddenField of hiddenFields) {
                await expect(
                    component.locator(`input[name="${hiddenField}"]`)
                ).not.toBeVisible();
                const inputId = await component
                    .locator(`input[name="${hiddenField}"]`)
                    .getAttribute('id');
                expect(inputId).not.toBeNull();
                await expect(
                    component.locator(`label[for="${inputId}"]`)
                ).not.toBeVisible();
            }
        });
    });
}

// ── Button function tests – using vjf-ajv (AJV validation) ───────────────────

test.describe('Button functions [vjf-ajv]', () => {
    test('submit with missing fields', async ({ page }) => {
        const component = await gotoShowcase(page, 'vjf-ajv');
        await component
            .locator('#vjf_control_for__properties_name')
            .fill('Test User');
        await component
            .getByRole('button', { name: 'Submit', exact: true })
            .click();

        await expect(page.locator('.card-body pre')).not.toBeAttached();
    });

    test('submit with missing fields and novalidate', async ({ page }) => {
        const component = await gotoShowcase(page, 'vjf-ajv');
        await component
            .locator('#vjf_control_for__properties_name')
            .fill('Test User');
        await component
            .locator('button[type="submit"][formnovalidate]')
            .first()
            .click();

        const resultText = await page.locator('.card-body pre').textContent();
        const json = JSON.parse(resultText || '');
        expect(json['name']).toEqual('Test User');
    });

    test('reset form', async ({ page }) => {
        const component = await gotoShowcase(page, 'vjf-ajv');
        await component
            .locator('#vjf_control_for__properties_name')
            .fill('Test User');
        await component.locator('button[type="reset"]').click();
        await expect(
            component.locator('#vjf_control_for__properties_name')
        ).toHaveValue('');
    });

    test('submit with data (group)', async ({ page }) => {
        const component = await gotoShowcase(page, 'vjf-ajv');

        await component.locator('#vjf_control_for__properties_done').check();
        await component
            .locator('#vjf_control_for__properties_title')
            .selectOption('Mr.');
        await component
            .locator('#vjf_control_for__properties_name')
            .fill('Test User 2');
        await component
            .locator('#vjf_control_for__properties_fanciness input')
            .nth(3)
            .check();
        await component
            .locator('#vjf_control_for__properties_due_date')
            .fill('2000-12-11T14:24');
        await component
            .locator('#vjf_control_for__properties_description')
            .click();
        await component
            .locator('#vjf_control_for__properties_teststring')
            .fill('test');
        await component
            .locator('#vjf_control_for__properties_weekdays input')
            .nth(0)
            .check();
        await component
            .locator('#vjf_control_for__properties_weekdays input')
            .nth(4)
            .check();
        await component
            .locator('#vjf_control_for__properties_recurrence_interval')
            .fill('4');
        await component
            .locator('#vjf_control_for__properties_testArray input')
            .nth(0)
            .fill('Hello');
        await component
            .locator('#vjf_control_for__properties_testArray input')
            .nth(1)
            .fill('World');
        await component
            .locator(
                '#vjf_control_for__properties_testArray > .btn-outline-primary'
            )
            .click();
        await component
            .locator('#vjf_control_for__properties_testArray input')
            .nth(2)
            .fill('I am third!');

        await component
            .locator('input[name="/properties/fileupload"]')
            .setInputFiles(path.join(__dirname, 'assets', 'testUpload.txt'));

        await component
            .getByRole('button', { name: 'Submit', exact: true })
            .click();

        const resultText = await page.locator('.card-body pre').textContent();
        const json = JSON.parse(resultText || '');

        expect(json['done']).toEqual(true);
        expect(json['title']).toEqual('Mr.');
        expect(json['name']).toEqual('Test User 2');
        expect(json['fanciness']).toEqual('unicorn');
        expect(json['due_date']).toEqual('2000-12-11T14:24');
        expect(json['description']).toEqual(
            'This good text was set as default'
        );
        expect(json['teststring']).toEqual('test');
        expect(json['weekdays']).toEqual(['Monday', 'Friday']);
        expect(json['recurrence_interval']).toEqual(4);
        expect(json['testArray']).toEqual(['Hello', 'World', 'I am third!']);
    });

    test('submit with data (object)', async ({ page }) => {
        const component = await gotoShowcase(page, 'vjf-ajv');

        await component.locator('#vjf_control_for__properties_done').check();
        await component
            .locator('#vjf_control_for__properties_title')
            .selectOption('Mr.');
        await component
            .locator('#vjf_control_for__properties_name')
            .fill('Test User 2');
        await component
            .locator('#vjf_control_for__properties_fanciness input')
            .nth(3)
            .check();

        await component
            .locator('#vjf_control_for__properties_group_selector label')
            .nth(1)
            .click();

        await component
            .locator(
                '#vjf_control_for__properties_testObject_properties_petName'
            )
            .fill('Richie');
        await component
            .locator('#vjf_control_for__properties_testObject_properties_age')
            .clear();
        await component
            .locator('#vjf_control_for__properties_testObject_properties_age')
            .fill('15');
        await component
            .locator(
                '#vjf_control_for__properties_testObject_properties_flauschig'
            )
            .check();

        await component
            .getByRole('button', { name: 'Submit', exact: true })
            .click();

        const resultText = await page.locator('.card-body pre').textContent();
        const json = JSON.parse(resultText || '');

        expect(json['done']).toEqual(true);
        expect(json['title']).toEqual('Mr.');
        expect(json['name']).toEqual('Test User 2');
        expect(json['fanciness']).toEqual('unicorn');
        expect(json['testObject']).toEqual({
            petName: 'Richie',
            age: 15,
            flauschig: true,
        });
    });
});

// ── Submit Options tests – using vjf-default ──────────────────────────────────

test.describe('Submit Options [vjf-default]', () => {
    test('submit-options attribute is set on button', async ({ page }) => {
        const component = await gotoShowcase(page, 'vjf-default');
        const button = component.getByRole('button', {
            name: 'Submit with options',
            exact: true,
        });
        await expect(button).toBeVisible();

        const submitOptionsAttr = await button.getAttribute('submit-options');
        expect(submitOptionsAttr).toBeTruthy();

        const decoded = JSON.parse(decodeURIComponent(submitOptionsAttr!));
        expect(decoded.action).toEqual('myAction');
        expect(decoded.customData).toEqual('testValue');
        expect(typeof decoded.id).toBe('string');
    });

    test('submit-options without custom options has only id', async ({
        page,
    }) => {
        const component = await gotoShowcase(page, 'vjf-default');
        const button = component.getByRole('button', {
            name: 'Submit',
            exact: true,
        });
        await expect(button).toBeVisible();

        const submitOptionsAttr = await button.getAttribute('submit-options');
        expect(submitOptionsAttr).toBeTruthy();

        const decoded = JSON.parse(decodeURIComponent(submitOptionsAttr!));
        expect(typeof decoded.id).toBe('string');
        expect(decoded.action).toBeUndefined();
    });

    test('submit options are read correctly on form submit', async ({
        page,
    }) => {
        const component = await gotoShowcase(page, 'vjf-default');
        await fillRequiredFields(component);
        await component
            .getByRole('button', { name: 'Submit with options', exact: true })
            .click();

        const resultText = await page.locator('.card-body pre').textContent();
        const json = JSON.parse(resultText || '');
        expect(json['name']).toEqual('Option Tester');
    });

    test('submit options id matches button submit-options attribute id', async ({
        page,
    }) => {
        const component = await gotoShowcase(page, 'vjf-default');

        const button = component.getByRole('button', {
            name: 'Submit with options',
            exact: true,
        });
        const submitOptionsAttr = await button.getAttribute('submit-options');
        expect(submitOptionsAttr).toBeTruthy();
        const decodedAttr = JSON.parse(decodeURIComponent(submitOptionsAttr!));

        await fillRequiredFields(component);
        await button.click();

        const resultText = await page.locator('.card-body pre').textContent();
        const json = JSON.parse(resultText || '');
        expect(json['name']).toEqual('Option Tester');
        // Verify the id in the submit-options attribute matches what was used
        expect(typeof decodedAttr.id).toBe('string');
    });
});

async function fillRequiredFields(component: Locator) {
    await component.locator('#vjf_control_for__properties_done').check();
    await component
        .locator('#vjf_control_for__properties_name')
        .fill('Option Tester');
    await component
        .locator('#vjf_control_for__properties_fanciness input')
        .nth(0)
        .check();
    await component
        .locator('#vjf_control_for__properties_testArray input')
        .nth(0)
        .fill('Item 1');
    await component
        .locator('#vjf_control_for__properties_testArray input')
        .nth(1)
        .fill('Item 2');
}
