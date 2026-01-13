import { test, expect, Page } from '@playwright/test';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Structure', () => {
    async function checkRadios(
        page: Page,
        containerID: string,
        values: string[]
    ) {
        const container = page.locator(containerID);
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

    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/showcase?nonav=true');
    });

    test('Switch', async ({ page }) => {
        const checkbox = page.locator('#vjf_control_for__properties_done');
        await expect(checkbox).toBeVisible();
        await expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    test('Title', async ({ page }) => {
        const id = 'select#vjf_control_for__properties_title';
        const select = page.locator(id);
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
        const id = 'div#vjf_control_for__properties_fanciness';
        await expect(page.locator(id)).toBeVisible();
        await checkRadios(page, id, [
            'fancy',
            'fancier',
            'fanciest',
            'unicorn',
        ]);
    });

    test('Fileupload', async ({ page }) => {
        await expect(
            page.locator('label[for="vjf_control_for__properties_fileupload"]')
        ).toBeVisible();
        await expect(
            page.locator('input[name="/properties/fileupload"]')
        ).toHaveAttribute('type', 'file');
    });

    test('Group selector', async ({ page }) => {
        const id = '#vjf_control_for__properties_group_selector';
        await expect(page.locator(id)).toBeVisible();
        const labels = page.locator(`${id} > label`);
        await expect(labels).toHaveCount(2);
        await expect(labels.first()).toBeVisible();
        await expect(labels.last()).toBeVisible();
    });

    test.describe('Group', () => {
        test('dueDate', async ({ page }) => {
            const id = 'input#vjf_control_for__properties_due_date';
            await expect(page.locator(id)).toBeVisible();
            await expect(page.locator(id)).toHaveAttribute(
                'type',
                'datetime-local'
            );
        });

        test('Rating', async ({ page }) => {
            const id = 'input#vjf_control_for__properties_rating';
            const rating = page.locator(id);
            await expect(rating).toBeVisible();
            await expect(rating).toHaveAttribute('type', 'range');
            await expect(rating).toHaveAttribute('min', '0');
            await expect(rating).toHaveAttribute('max', '5');
            await expect(rating).toHaveAttribute('step', '1');
            await expect(rating).toHaveValue('3');
        });

        test('Description', async ({ page }) => {
            const id = 'textarea#vjf_control_for__properties_description';
            const description = page.locator(id);
            await expect(description).toBeVisible();
            await expect(description).toHaveValue(
                'This good text was set as default'
            );
            await expect(description).toHaveAttribute('rows', '2');
        });

        test('Teststring', async ({ page }) => {
            const id = 'input#vjf_control_for__properties_teststring';
            await expect(page.locator(id)).toBeVisible();
            await expect(page.locator(id)).toHaveAttribute('type', 'text');
        });

        test('Weekdays', async ({ page }) => {
            const id = 'div#vjf_control_for__properties_weekdays';
            const container = page.locator(id);
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
            const id = 'input#vjf_control_for__properties_recurrence_interval';
            const input = page.locator(id);
            await expect(input).toBeVisible();
            await expect(input).toHaveAttribute('type', 'number');
            await expect(input).toHaveAttribute('step', '1');
            const sibling = await input.locator(
                'xpath=following-sibling::*[1]'
            );
            await expect(sibling).toHaveText('Weeks');
        });

        test('TestArray', async ({ page }) => {
            const id = 'div[name="/properties/testArray"]';
            const container = page.locator(id);
            await expect(container).toBeVisible();
            await expect(container.locator('input')).toHaveCount(2);
            await expect(container.locator('input').first()).toBeVisible();
            await expect(container.locator('input').first()).toHaveAttribute(
                'placeholder',
                'This is a placeholder'
            );
            await expect(
                container.locator('button[aria-label="Add Item"]')
            ).toBeVisible();
        });
    });

    test.describe('Object', () => {
        test.beforeEach(async ({ page }) => {
            await page
                .locator('#vjf_control_for__properties_group_selector')
                .locator('> *')
                .nth(3)
                .click();
        });

        test('name', async ({ page }) => {
            const id =
                'input#vjf_control_for__properties_testObject_properties_petName';
            await expect(page.locator(id)).toBeVisible();
            await expect(page.locator(id)).toHaveAttribute('type', 'text');
        });

        test('age', async ({ page }) => {
            const id =
                'input#vjf_control_for__properties_testObject_properties_age';
            const age = page.locator(id);
            await expect(age).toBeVisible();
            await expect(age).toHaveAttribute('type', 'number');
            await expect(age).toHaveAttribute('step', '1');
            await expect(age).toHaveAttribute('min', '0');
            await expect(age).toHaveAttribute('max', '100');
            await expect(age).toHaveValue('10');
        });

        test('flauschig', async ({ page }) => {
            const id =
                'input#vjf_control_for__properties_testObject_properties_flauschig';
            await expect(page.locator(id)).toBeVisible();
            await expect(page.locator(id)).toHaveAttribute('type', 'checkbox');
        });
    });

    test('HTML text', async ({ page }) => {
        const id = 'span.vjf_htmlRenderer > p';
        await expect(page.locator(id)).toBeVisible();
        expect(await page.locator(id).innerHTML()).toBe(
            'Ich bin ein <strong class="text-primary">HTML</strong> Text'
        );
    });

    test('Form Buttons', async ({ page }) => {
        await expect(
            page.locator('button[type="submit"]:not([formnovalidate])')
        ).toBeVisible();
        await expect(
            page.locator('button[type="submit"][formnovalidate]')
        ).toBeVisible();
        await expect(page.locator('button[type="reset"]')).toBeVisible();
    });

    test('Fancy Unicorn', async ({ page }) => {
        await page
            .locator('#vjf_control_for__properties_fanciness input')
            .nth(3)
            .check();
        await page
            .locator('input[type=range]#vjf_control_for__properties_rating')
            .fill('4');

        const id = 'span.vjf_htmlRenderer > h3';
        await expect(page.locator(id)).toHaveText(
            'You are a very fancy unicorn my friend...'
        );
        await expect(page.locator(id)).toHaveAttribute(
            'style',
            'background-image:linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red);-webkit-background-clip:text;color:transparent'
        );
    });
});

test.describe('Button functions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/showcase?nonav=true');
    });

    test('submit with missing fields', async ({ page }) => {
        await page
            .locator('#vjf_control_for__properties_name')
            .fill('Test User');
        await page
            .locator('button[type="submit"]:not([formnovalidate])')
            .click();

        await expect(page.locator('#result-container')).not.toBeAttached();
    });

    test('submit with missing fields and novalidate', async ({ page }) => {
        await page
            .locator('#vjf_control_for__properties_name')
            .fill('Test User');
        await page.locator('button[type="submit"][formnovalidate]').click();

        const resultText = await page
            .locator('#result-container')
            .textContent();
        const json = JSON.parse(resultText || '');
        expect(json['name']).toEqual('Test User');
    });

    test('reset form', async ({ page }) => {
        await page
            .locator('#vjf_control_for__properties_name')
            .fill('Test User');
        await page.locator('button[type="reset"]').click();
        await expect(
            page.locator('#vjf_control_for__properties_name')
        ).toHaveValue('');
    });

    test('submit with data (group)', async ({ page }) => {
        await page.locator('#vjf_control_for__properties_done').check();
        await page
            .locator('#vjf_control_for__properties_title')
            .selectOption('Mr.');
        await page
            .locator('#vjf_control_for__properties_name')
            .fill('Test User 2');
        await page
            .locator('#vjf_control_for__properties_fanciness input')
            .nth(3)
            .check();
        await page
            .locator('#vjf_control_for__properties_due_date')
            .fill('2000-12-11T14:24');
        await page.locator('#vjf_control_for__properties_description').click();
        await page
            .locator('#vjf_control_for__properties_teststring')
            .fill('test');
        await page
            .locator('#vjf_control_for__properties_weekdays input')
            .nth(0)
            .check();
        await page
            .locator('#vjf_control_for__properties_weekdays input')
            .nth(4)
            .check();
        await page
            .locator('#vjf_control_for__properties_recurrence_interval')
            .fill('4');
        await page
            .locator('#vjf_control_for__properties_testArray input')
            .nth(0)
            .fill('Hello');
        await page
            .locator('#vjf_control_for__properties_testArray input')
            .nth(1)
            .fill('World');
        await page
            .locator(
                '#vjf_control_for__properties_testArray > .btn-outline-primary'
            )
            .click();
        await page
            .locator('#vjf_control_for__properties_testArray input')
            .nth(2)
            .fill('I am third!');

        // await page.locator('input[name="/properties/fileupload"]').click();
        await page
            .locator('input[name="/properties/fileupload"]')
            .setInputFiles(path.join(__dirname, 'assets', 'testUpload.txt'));

        await page.locator('.btn-primary').click();

        const resultText = await page
            .locator('#result-container')
            .textContent();
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
        expect(json['fileupload']).toEqual(undefined);
    });

    test('submit with data (object)', async ({ page }) => {
        await page.locator('#vjf_control_for__properties_done').check();
        await page
            .locator('#vjf_control_for__properties_title')
            .selectOption('Mr.');
        await page
            .locator('#vjf_control_for__properties_name')
            .fill('Test User 2');
        await page
            .locator('#vjf_control_for__properties_fanciness input')
            .nth(3)
            .check();

        await page
            .locator('#vjf_control_for__properties_group_selector label')
            .nth(1)
            .click();

        await page
            .locator(
                '#vjf_control_for__properties_testObject_properties_petName'
            )
            .fill('Richie');
        await page
            .locator('#vjf_control_for__properties_testObject_properties_age')
            .clear();
        await page
            .locator('#vjf_control_for__properties_testObject_properties_age')
            .fill('15');
        await page
            .locator(
                '#vjf_control_for__properties_testObject_properties_flauschig'
            )
            .check();

        await page
            .locator('input[name="/properties/fileupload"]')
            .setInputFiles(path.join(__dirname, 'assets', 'testUpload.pdf'));

        await page.locator('.btn-primary').click();

        const resultText = await page
            .locator('#result-container')
            .textContent();
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

        const fileHash = createHash('sha256')
            .update(json['fileupload'])
            .digest('base64');
        expect(fileHash).toEqual(
            '1GW+tQlX6j/o+hU/18VW33uDoKfkWyA9AcCmSvKWhQw='
        );
    });
});
