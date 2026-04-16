import { test, expect, type Page, type Locator } from '@playwright/test';

function submitForm(page: Page) {
    return page.locator('button[type="submit"]').nth(-3).click();
}

const WAIT_TIME = 150;
const REPRODUCE_URL = 'http://localhost:5173/reproduce?nonav=true';
const TEST_FILE_TXT = 'tests/e2e/assets/testUpload.txt';
const TEST_FILE_PDF = 'tests/e2e/assets/testUpload.pdf';

const expectSelectOptions = async (
    page: Page,
    selector: string,
    expectedValues: string[]
) => {
    const options = page.locator(`${selector} option`);
    await expect(options).toHaveCount(expectedValues.length);

    for (let index = 0; index < expectedValues.length; index++) {
        await expect(options.nth(index)).toHaveAttribute(
            'value',
            expectedValues[index]
        );
    }
};

async function expectIsRequiredField(page: Page, requiredFieldId: string) {
    await expect(page.locator('#' + requiredFieldId)).toBeVisible();
    await expect(page.locator('#' + requiredFieldId)).toHaveAttribute(
        'required',
        ''
    );
    await expect(page.locator(`label[for="${requiredFieldId}"]`)).toContainText(
        '*'
    );
}

async function expectIsNotRequiredField(page: Page, requiredFieldId: string) {
    await expect(page.locator('#' + requiredFieldId)).not.toHaveAttribute(
        'required',
        ''
    );
    await expect(
        page.locator(`label[for="${requiredFieldId}"]`)
    ).not.toContainText('*');
}

async function expectInvalid(locator: Locator) {
    await expect
        .poll(() => locator.evaluate((el) => el.matches(':invalid')))
        .toBe(true);
}

async function expectValid(locator: Locator) {
    await expect
        .poll(() => locator.evaluate((el) => el.matches(':valid')))
        .toBe(true);
}

test('JSO-151 (checkboxesWithPreset is prefilled correctly)', async ({
    page,
}) => {
    const CHECKBOX_GROUP = '#vjf_control_for__properties_checkboxesWithPreset';
    await page.goto(REPRODUCE_URL);

    await expect(
        page.locator(`${CHECKBOX_GROUP} input[value="a"]`)
    ).not.toBeChecked();
    await expect(
        page.locator(`${CHECKBOX_GROUP} input[value="b"]`)
    ).toBeChecked();
    await expect(
        page.locator(`${CHECKBOX_GROUP} input[value="c"]`)
    ).toBeChecked();

    await submitForm(page);
    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['checkboxesWithPreset']).toEqual(['b', 'c']);
});

test('JSO-151 (fileUploadWithPreset is prefilled)', async ({ page }) => {
    await page.goto(REPRODUCE_URL);
    await submitForm(page);

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['fileUploadWithPreset']).toEqual(
        'data:application/pdf;name=testUpload.pdf;base64,JVBERi0xLjQKJcOiw6MKMSAwIG9iago8PAovVGl0bGUgKP7/AHQAZQBzAHQAVQBwAGwAbwBhAGQALikKL0NyZWF0b3IgKP7/AEMAYQBsAGwAaQBnAHIAYQAgAFcAbwByAGQAcwAgADEANgA0ADEANAA3ADMpCi9BdXRob3IgKCkKL1Byb2R1Y2VyICj+/wBRAHQAIAA2AC4AMQAwAC4AMSkKL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MDExMzE0NTYxMSswMScwMCcpCi9Nb2REYXRlIChEOjIwMjYwMTEzMTQ1NjExKzAxJzAwJykKL1RyYXBwZWQgL0ZhbHNlCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9NZXRhZGF0YSAvU3VidHlwZSAvWE1MCi9MZW5ndGggMTI5Nwo+PgpzdHJlYW0KPD94cGFja2V0IGJlZ2luPScnIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz48eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6cGRmPSJodHRwOi8vbnMuYWRvYmUuY29tL3BkZi8xLjMvIiB4bWxuczpwZGZhaWQ9Imh0dHA6Ly93d3cuYWlpbS5vcmcvcGRmYS9ucy9pZC8iIHhtbG5zOnBkZnhpZD0iaHR0cDovL3d3dy5ucGVzLm9yZy9wZGZ4L25zL2lkLyI+CiAgICA8cmRmOlJERj4KICAgICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIj4KICAgICAgICAgICAgPGRjOnRpdGxlPgogICAgICAgICAgICAgICAgPHJkZjpBbHQ+CiAgICAgICAgICAgICAgICAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij50ZXN0VXBsb2FkLjwvcmRmOmxpPgogICAgICAgICAgICAgICAgPC9yZGY6QWx0PgogICAgICAgICAgICA8L2RjOnRpdGxlPgogICAgICAgICAgICA8ZGM6Y3JlYXRvcj4KICAgICAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICAgICAgIDxyZGY6bGk+PC9yZGY6bGk+CiAgICAgICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgICAgIDwvZGM6Y3JlYXRvcj4KICAgICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiBwZGY6UHJvZHVjZXI9IlF0IDYuMTAuMSIgcGRmOlRyYXBwZWQ9IkZhbHNlIi8+CiAgICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1wOkNyZWF0b3JUb29sPSJDYWxsaWdyYSBXb3JkcyAxNjQxNDczIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNi0wMS0xM1QxNDo1NjoxMSswMTowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjYtMDEtMTNUMTQ6NTY6MTErMDE6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjYtMDEtMTNUMTQ6NTY6MTErMDE6MDAiLz4KICAgICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bXBNTTpEb2N1bWVudElEPSJ1dWlkOmZiODJhOWJiLTA4YjgtNDY2Yi1hMDE4LTQxMmM3NTg1YWE4OCIgeG1wTU06VmVyc2lvbklEPSIxIiB4bXBNTTpSZW5kaXRpb25DbGFzcz0iZGVmYXVsdCIvPgogICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KPD94cGFja2V0IGVuZD0ndyc/PgplbmRzdHJlYW0KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDQgMCBSCi9OYW1lcyA1IDAgUgovTWV0YWRhdGEgMiAwIFIKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL1R5cGUgL0V4dEdTdGF0ZQovU0EgdHJ1ZQovU00gMC4wMgovY2EgMS4wCi9DQSAxLjAKL0FJUyBmYWxzZQovU01hc2sg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PDAwMDA+CjwwMDAxPiA8MDAwQz4gWzwwMDQ5PiA8MDAwOT4gPDAwNjE+IDwwMDZEPiA8MDA1ND4gPDAwNjU+IDwwMDczPiA8MDA3ND4gPDAwNjY+IDwwMDY5PiA8MDA2Qz4gPDAwMjE+IF0KZW5kYmZyYW5nZQplbmRjbWFwCkNNYXBOYW1lIGN1cnJlbnRkaWN0IC9DTWFwIGRlZmluZXJlc291cmNlIHBvcAplbmQKZW5kCgplbmRzdHJlYW0KZW5kb2JqCjExIDAgb2JqCjw8IC9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMAovQmFzZUZvbnQgL05vdG9TYW5zTkYtUmVnCi9FbmNvZGluZyAvSWRlbnRpdHktSAovRGVzY2VuZGFudEZvbnRzIFsxOCAwIFJdCi9Ub1VuaWNvZGUgMTkgMCBSPj4KZW5kb2JqCjIwIDAgb2JqCjw8Ci9MZW5ndGggMgo+PgpzdHJlYW0K//gKZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyAKWwoxMCAwIFIKXQovQ291bnQgMQovUHJvY1NldCBbL1BERiAvVGV4dCAvSW1hZ2VCIC9JbWFnZUNdCj4+CmVuZG9iago1IDAgb2JqCjw8Cj4+CmVuZG9iagp4cmVmCjAgMjIKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAyNjMgMDAwMDAgbiAKMDAwMDAwMTY0MiAwMDAwMCBuIAowMDAwMDA2NjkyIDAwMDAwIG4gCjAwMDAwMDY3OTEgMDAwMDAgbiAKMDAwMDAwMTcyMCAwMDAwMCBuIAowMDAwMDAxODE1IDAwMDAwIG4gCjAwMDAwMDE4NTIgMDAwMDAgbiAKMDAwMDAwMTg5MCAwMDAwMCBuIAowMDAwMDAxOTI4IDAwMDAwIG4gCjAwMDAwMDY0OTkgMDAwMDAgbiAKMDAwMDAwMjMzOSAwMDAwMCBuIAowMDAwMDAyODU3IDAwMDAwIG4gCjAwMDAwMDIxMDEgMDAwMDAgbiAKMDAwMDAwMjMxOSAwMDAwMCBuIAowMDAwMDAyODc3IDAwMDAwIG4gCjAwMDAwMDMxMDMgMDAwMDAgbiAKMDAwMDAwNTczMyAwMDAwMCBuIAowMDAwMDA1OTk5IDAwMDAwIG4gCjAwMDAwMDY2NDAgMDAwMDAgbiAKMDAwMDAwNTcxMiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDIyIAovSW5mbyAxIDAgUgovUm9vdCAzIDAgUgovSUQgWyA8NjY2MjM4MzI2MTM5NjI2MjJkMzAzODYyMzgyZDM0MzYzNjYyMmQ2MTMwMzEzODJkMzQzMTMyNjMzNzM1MzgzNTYxNjEzODM4PiA8NjY2MjM4MzI2MTM5NjI2MjJkMzAzODYyMzgyZDM0MzYzNjYyMmQ2MTMwMzEzODJkMzQzMTMyNjMzNzM1MzgzNTYxNjEzODM4PiBdCj4+CnN0YXJ0eHJlZgo2ODEyIAolJUVPRgo='
    );
});

test('JSO-151 (arrayWithObjectWithPreset is prefilled)', async ({ page }) => {
    await page.goto(REPRODUCE_URL);
    await submitForm(page);

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['arrayWithObjectWithPreset']).toEqual([
        { name: 'John' },
        { name: 'Jane' },
    ]);
});

test('JSO-146 (nested required mapping in optional object)', async ({
    page,
}) => {
    const ROOT_FIELD = '#vjf_control_for__properties_jso-146_properties_feld';
    const OBJECT_CONTAINER = page.locator(
        '*[name="/properties/jso-146/properties/objekt"]'
    );
    const INDEPENDENT_FIELD =
        '#vjf_control_for__properties_jso-146_properties_objekt_properties_unabhaengiges-feld-in-objekt';
    const DEPENDENT_FIELD_ID =
        'vjf_control_for__properties_jso-146_properties_objekt_properties_abhaengiges-pflichtfeld-in-objekt';
    const DEPENDENT_FIELD = '#' + DEPENDENT_FIELD_ID;

    await page.goto(REPRODUCE_URL);

    await expect(OBJECT_CONTAINER).not.toBeVisible();
    await expect(page.locator(DEPENDENT_FIELD)).not.toBeVisible();

    await page.locator(ROOT_FIELD).fill('show-object');
    await expect(OBJECT_CONTAINER).toBeVisible();
    await expect(page.locator(INDEPENDENT_FIELD)).toBeVisible();
    await expect(page.locator(DEPENDENT_FIELD)).not.toBeVisible();

    await page.locator(INDEPENDENT_FIELD).fill('trigger-required');
    await expectIsRequiredField(page, DEPENDENT_FIELD_ID);

    await submitForm(page);
    await expect(page.locator('#result-container')).not.toBeAttached();

    await page.locator(DEPENDENT_FIELD).fill('required-value');
    await submitForm(page);
    await expect(page.locator('#result-container')).toBeVisible();

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['jso-146']['feld']).toBe('show-object');
    expect(res['jso-146']['objekt']['unabhaengiges-feld-in-objekt']).toBe(
        'trigger-required'
    );
    expect(res['jso-146']['objekt']['abhaengiges-pflichtfeld-in-objekt']).toBe(
        'required-value'
    );
});

test('JSO-126 - Uploadfield', async ({ page }) => {
    await page.goto(REPRODUCE_URL);

    const fileInput = page.locator(
        "input[name='/properties/multiFileUpload2']"
    );

    // Test 1: Empty field should pass validation (field is not required)
    await submitForm(page);
    await expect(page.locator('#result-container')).toBeVisible();

    // Reload page for clean state
    await page.goto(REPRODUCE_URL);

    // Test 2: Upload 1 file (less than minItems=2) should fail validation
    await fileInput.setInputFiles(TEST_FILE_TXT);
    await page.waitForTimeout(WAIT_TIME);
    await submitForm(page);
    await expect(page.locator('#result-container')).not.toBeAttached();
    await expectInvalid(fileInput);

    // Test 3: Upload 2 files (meets minItems=2) should pass validation
    await fileInput.setInputFiles([TEST_FILE_TXT, TEST_FILE_PDF]);
    await page.waitForTimeout(WAIT_TIME);
    await expectValid(fileInput);
    await submitForm(page);
    await expect(page.locator('#result-container')).toBeVisible();

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['multiFileUpload2']).toBeDefined();
    expect(res['multiFileUpload2'].length).toBe(2);
});

test('JSO-126 - Array with minItems (not required)', async ({ page }) => {
    await page.goto(REPRODUCE_URL);

    // Test 1: Empty array should pass validation (field is not required)
    await submitForm(page);
    await expect(page.locator('#result-container')).toBeVisible();

    let resultText = await page.locator('#result-container').textContent();
    let res = JSON.parse(resultText || '');
    expect(res['jso-126']).toBeUndefined();

    await page.goto(REPRODUCE_URL);
    await expect(
        page.locator(
            '#vjf_control_for__properties_jso-126_properties_uploadfield-with-minitems input'
        )
    ).toBeHidden();
    await page
        .locator(
            '#vjf_control_for__properties_jso-126_properties_uploadfield-with-minitems > button'
        )
        .click();
    expect(
        await page
            .locator(
                '#vjf_control_for__properties_jso-126_properties_uploadfield-with-minitems input'
            )
            .all()
    ).toHaveLength(2);
    await page
        .locator(
            '#vjf_control_for__properties_jso-126_properties_uploadfield-with-minitems button.btn-outline-danger'
        )
        .first()
        .click();

    await expect(page.locator('.modal.show .modal-body')).toBeVisible();
    await page
        .locator('.modal.show .modal-footer button:text("Delete")')
        .click();
    await expect(
        page.locator(
            '#vjf_control_for__properties_jso-126_properties_uploadfield-with-minitems input'
        )
    ).toBeHidden();
});

test('Disabled Button', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');
    await expect(
        page.locator('button[type="submit"].disabled-submit-button-test-class')
    ).toBeDisabled();
});

test('JSO-112 (acceptedFileType)', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await page.locator('#vjf_control_for__properties_uploooad button').click();

    const fileInput = page.locator(
        '#vjf_control_for__properties_uploooad input[type="file"]'
    );
    await expect(fileInput).toHaveAttribute(
        'accept',
        'application/pdf,image/png'
    );
});

test('JSO-108 (checkbox group validation)', async ({ page }) => {
    const SHOW_TOGGLE = '#vjf_control_for__properties_showJso-108';
    const BASE = '#vjf_control_for__properties_jso-108_properties';
    const DEFAULT_REQUIRED = `${BASE}_defaultRequired`;
    const ONE_REQUIRED = `${BASE}_oneRequired`;
    const TWO_REQUIRED = `${BASE}_twoRequired`;
    const MAX_TWO_REQUIRED = `${BASE}_maxTwoRequired`;

    const checkbox = (groupId: string, value: string) =>
        page.locator(`${groupId} input[type="checkbox"][value="${value}"]`);
    const firstCheckbox = (groupId: string) =>
        page.locator(`${groupId} input[type="checkbox"]`).first();

    await page.goto('http://localhost:5173/reproduce?nonav=true');
    await page.locator(SHOW_TOGGLE).check();
    await expect(page.locator(DEFAULT_REQUIRED)).toBeVisible();

    await submitForm(page);
    await expect(page.locator('#result-container')).not.toBeAttached();
    await expectInvalid(firstCheckbox(ONE_REQUIRED));
    await expectInvalid(firstCheckbox(TWO_REQUIRED));

    await checkbox(ONE_REQUIRED, 'a').check();
    await submitForm(page);
    await expect(page.locator('#result-container')).not.toBeAttached();
    await expectValid(firstCheckbox(ONE_REQUIRED));
    await expectInvalid(firstCheckbox(TWO_REQUIRED));

    await checkbox(TWO_REQUIRED, 'a').check();
    await checkbox(TWO_REQUIRED, 'b').check();
    await checkbox(MAX_TWO_REQUIRED, 'a').check();
    await checkbox(MAX_TWO_REQUIRED, 'b').check();
    await checkbox(MAX_TWO_REQUIRED, 'c').check();
    await submitForm(page);
    await expect(page.locator('#result-container')).not.toBeAttached();
    await expectInvalid(checkbox(MAX_TWO_REQUIRED, 'a'));

    await checkbox(MAX_TWO_REQUIRED, 'c').uncheck();
    await checkbox(DEFAULT_REQUIRED, 'a').check();
    await submitForm(page);

    await expect(page.locator('#result-container')).toBeVisible();
    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['jso-108']['defaultRequired']).toEqual(['a']);
    expect(res['jso-108']['oneRequired']).toEqual(['a']);
    expect(res['jso-108']['twoRequired']).toEqual(['a', 'b']);
    expect(res['jso-108']['maxTwoRequired']).toEqual(['a', 'b']);
});

test('JSO-91 (Modal)', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    const triggerButton = page.getByRole('button', {
        name: 'Show additional information in Modal',
    });
    await expect(triggerButton).toBeVisible();
    await triggerButton.click();

    const modal = page.getByRole('dialog', { name: 'Additional information' });
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(
        'This is some additional information that can be shown in a modal.'
    );
    await expect(modal.locator('strong.text-success')).toHaveText('HTML');

    await modal.locator('button.btn').click();
    await expect(modal).not.toBeVisible();
});

test('JSO-96', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');
    await expect(
        page.locator(
            '#vjf_control_for__properties_jso-96_properties_objekt_properties_feld-4'
        )
    ).not.toBeVisible();
    await page
        .locator(
            'input[name="/properties/jso-96/properties/ja-oder-nein"][value="ja"]'
        )
        .check();
    await expectIsRequiredField(
        page,
        'vjf_control_for__properties_jso-96_properties_objekt_properties_feld-4'
    );
});

test('JSO-96 (array)', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');
    await page
        .locator(
            '#vjf_control_for__properties_jso-96_properties_array > button'
        )
        .click();
    await page
        .locator(
            '#vjf_control_for__properties_jso-96_properties_array > button'
        )
        .click();
    await expect(
        page.locator(
            '#vjf_control_for__properties_jso-96_properties_array > .list-group > *:first-child input[type=text]'
        )
    ).not.toHaveAttribute('required', '');
    await expect(
        page.locator(
            '#vjf_control_for__properties_jso-96_properties_array > .list-group > *:last-child input[type=text]'
        )
    ).not.toHaveAttribute('required', '');

    await page
        .locator(
            '#vjf_control_for__properties_jso-96_properties_array > .list-group > *:first-child input[type=checkbox]'
        )
        .check();

    await expect(
        page.locator(
            '#vjf_control_for__properties_jso-96_properties_array > .list-group > *:first-child input[type=text]'
        )
    ).toHaveAttribute('required', '');
    await expect(
        page.locator(
            '#vjf_control_for__properties_jso-96_properties_array > .list-group > *:last-child input[type=text]'
        )
    ).not.toHaveAttribute('required', '');
});

test('JSO-116 (if/then required for dependent)', async ({ page }) => {
    const TEST_FIELD = '#vjf_control_for__properties_jso-116_properties_test';
    const DEPENDENT_FIELD_ID =
        'vjf_control_for__properties_jso-116_properties_dependent';
    const DEPENDENT_FIELD = '#' + DEPENDENT_FIELD_ID;

    await page.goto(REPRODUCE_URL);

    await expect(page.locator(DEPENDENT_FIELD)).not.toBeVisible();

    await page.locator(TEST_FIELD).check({ force: true });
    await expectIsRequiredField(page, DEPENDENT_FIELD_ID);

    await submitForm(page);
    await expect(page.locator('#result-container')).not.toBeAttached();

    await page.locator(DEPENDENT_FIELD).fill('required-by-test');
    await submitForm(page);
    await expect(page.locator('#result-container')).toBeVisible();

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['jso-116']['test']).toBe(true);
    expect(res['jso-116']['dependent']).toBe('required-by-test');

    await page.locator(TEST_FIELD).uncheck({ force: true });
    await expect(page.locator(DEPENDENT_FIELD)).not.toBeVisible();
});

test('JSO-116 (if.required number makes number-dependent required)', async ({
    page,
}) => {
    const NUMBER_FIELD =
        '#vjf_control_for__properties_jso-116_properties_number';
    const NUMBER_DEPENDENT_FIELD_ID =
        'vjf_control_for__properties_jso-116_properties_number-dependent';
    const NUMBER_DEPENDENT_FIELD = '#' + NUMBER_DEPENDENT_FIELD_ID;

    await page.goto(REPRODUCE_URL);

    await expectIsNotRequiredField(page, NUMBER_DEPENDENT_FIELD_ID);

    await page.locator(NUMBER_FIELD).fill('0');
    await expectIsRequiredField(page, NUMBER_DEPENDENT_FIELD_ID);

    await submitForm(page);
    await expect(page.locator('#result-container')).not.toBeAttached();

    await page.locator(NUMBER_DEPENDENT_FIELD).fill('required-by-number');
    await submitForm(page);
    await expect(page.locator('#result-container')).toBeVisible();

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['jso-116']['number']).toBe(0);
    expect(res['jso-116']['number-dependent']).toBe('required-by-number');

    await page.locator(NUMBER_FIELD).clear();
    await expectIsNotRequiredField(page, NUMBER_DEPENDENT_FIELD_ID);
});

test('JSO-43', async ({ page }) => {
    const BOOL_FIELD = '#vjf_control_for__properties_jso-43_properties_bool';
    const HALLO_FIELD =
        '#vjf_control_for__properties_jso-43_properties_hallo input[value="du"]';
    const HALLO_FIELD_ICH =
        '#vjf_control_for__properties_jso-43_properties_hallo input[value="ich"]';
    const REQUIRED_FIELD_ID =
        'vjf_control_for__properties_jso-43_properties_abhaengiges-feld';
    const REQUIRED_FIELD = '#' + REQUIRED_FIELD_ID;

    await page.goto('http://localhost:5173/reproduce?nonav=true');
    await expect(page.locator(REQUIRED_FIELD)).not.toBeVisible();

    await page.locator(BOOL_FIELD).check({ force: true });
    await expectIsRequiredField(page, REQUIRED_FIELD_ID);

    await page.locator(BOOL_FIELD).uncheck({ force: true });
    await page.locator(HALLO_FIELD_ICH).check({ force: true });
    await expect(page.locator(REQUIRED_FIELD)).not.toBeVisible();

    await page.locator(HALLO_FIELD).check({ force: true });
    await expectIsRequiredField(page, REQUIRED_FIELD_ID);

    await page.locator(REQUIRED_FIELD).fill('Hallo Pflichtfeld');
    await submitForm(page);

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['jso-43']['abhaengiges-feld']).toEqual('Hallo Pflichtfeld');
    expect(res['jso-43']['hallo']).toEqual('du');
});

test('JSO-79 (I)', async ({ page }) => {
    const FIRST_SELECT = '#vjf_control_for__properties_jso-79_properties_first';
    const SECOND_SELECT =
        '#vjf_control_for__properties_jso-79_properties_second';

    await page.goto('http://localhost:5173/reproduce?nonav=true');

    // Initial state: all options should be available
    await expectSelectOptions(page, SECOND_SELECT, ['a1', 'a2', 'b1']);

    // Select 'A': only 'a' options should be available
    await page.locator(FIRST_SELECT).selectOption('A');
    await page.waitForTimeout(WAIT_TIME);
    await expectSelectOptions(page, SECOND_SELECT, ['a1', 'a2']);

    // Select 'B': only 'b' options should be available
    await page.locator(FIRST_SELECT).selectOption('B');
    await page.waitForTimeout(WAIT_TIME);
    await expectSelectOptions(page, SECOND_SELECT, ['b1']);

    await page.locator(FIRST_SELECT).selectOption('A');
    await page.locator(SECOND_SELECT).selectOption('a1');
    await page.locator(FIRST_SELECT).selectOption('B');
    await page.waitForTimeout(WAIT_TIME);
    await submitForm(page);

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['jso-79']['second']).toBeUndefined();
});

test('JSO-79-II', async ({ page }) => {
    const BASE = '#vjf_control_for__properties_jso-79-ii_properties';
    const INDEPENDENT_SELECT = `${BASE}_unabhaengige-frage`;
    const DEPENDENT_SELECT = `${BASE}_abhaengige-frage`;
    const NAME_SELECT = `${BASE}_wie-heisst-du`;

    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await expectSelectOptions(page, DEPENDENT_SELECT, ['1', '2', '3']);

    await page.locator(INDEPENDENT_SELECT).selectOption('a');
    await page.waitForTimeout(WAIT_TIME);
    await expectSelectOptions(page, DEPENDENT_SELECT, ['1', '3']);

    await page.locator(DEPENDENT_SELECT).selectOption('1');

    await page.locator(NAME_SELECT).selectOption('Henrik');
    await page.waitForTimeout(WAIT_TIME);
    await expectSelectOptions(page, DEPENDENT_SELECT, ['2', '3']);
    await expect(page.locator(DEPENDENT_SELECT)).toHaveValue('');

    await page.locator(DEPENDENT_SELECT).selectOption('3');
    await submitForm(page);

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['jso-79-ii']['unabhaengige-frage']).toEqual('a');
    expect(res['jso-79-ii']['wie-heisst-du']).toEqual('Henrik');
    expect(res['jso-79-ii']['abhaengige-frage']).toEqual('3');
});

test('JSO-79-III', async ({ page }) => {
    const BASE = '#vjf_control_for__properties_jso-79-iii_properties';
    const INDEPENDENT_GROUP = `${BASE}_unabhaengige-frage`;
    const DEPENDENT_SELECT = `${BASE}_abhaengige-frage`;
    const NAME_SELECT = `${BASE}_wie-heisst-du`;

    const toggleIndependent = async (value: string, checked: boolean) => {
        const selector = `${INDEPENDENT_GROUP} input[value="${value}"]`;
        if (checked) {
            await page.locator(selector).check({ force: true });
        } else {
            await page.locator(selector).uncheck({ force: true });
        }
    };

    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await expectSelectOptions(page, DEPENDENT_SELECT, ['3']);

    await toggleIndependent('a', true);
    await page.waitForTimeout(WAIT_TIME);
    await expectSelectOptions(page, DEPENDENT_SELECT, ['3', '1']);

    await page.locator(NAME_SELECT).selectOption('Henrik');
    await page.waitForTimeout(WAIT_TIME);
    await expectSelectOptions(page, DEPENDENT_SELECT, ['2', '3', '1']);

    await toggleIndependent('a', false);
    await page.waitForTimeout(WAIT_TIME);
    await expectSelectOptions(page, DEPENDENT_SELECT, ['2', '3', '1']);

    await toggleIndependent('b', true);
    await toggleIndependent('c', true);
    await page.waitForTimeout(WAIT_TIME);
    await expectSelectOptions(page, DEPENDENT_SELECT, ['2', '3', '1', '4']);

    await page.locator(DEPENDENT_SELECT).selectOption('4');
    await submitForm(page);

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['jso-79-iii']['unabhaengige-frage']).toEqual(['b', 'c']);
    expect(res['jso-79-iii']['wie-heisst-du']).toEqual('Henrik');
    expect(res['jso-79-iii']['abhaengige-frage']).toEqual('4');
});

test('JSO-79-IV', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await expectIsNotRequiredField(
        page,
        'vjf_control_for__properties_string-dep-required-2'
    );

    await page
        .locator('#vjf_control_for__properties_string-dep-required')
        .fill('Test');

    await expectIsRequiredField(
        page,
        'vjf_control_for__properties_string-dep-required-2'
    );

    await page
        .locator('#vjf_control_for__properties_string-dep-required')
        .clear();

    await expectIsNotRequiredField(
        page,
        'vjf_control_for__properties_string-dep-required-2'
    );
});

test('JSO-68', async ({ page }) => {
    const ARRAY_CONTAINER = '#vjf_control_for__properties_multiFileUpload1';
    const SINGLE_UPLOAD = "input[name='/properties/multiFileUpload2']";
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await expect(page.locator(ARRAY_CONTAINER)).toBeVisible();
    await expect(page.locator(ARRAY_CONTAINER)).toHaveClass(/vjf_array/);
    await expect(
        page.locator(`${ARRAY_CONTAINER} button[aria-label="Add Item"]`)
    ).toBeVisible();

    await expect(
        page.locator(
            "label[for='vjf_control_for__properties_multiFileUpload2']"
        )
    ).toBeVisible();
    await expect(page.locator(SINGLE_UPLOAD)).toHaveAttribute('type', 'file');
    await expect(page.locator(SINGLE_UPLOAD)).toHaveAttribute('multiple', '');

    const parent = page
        .locator(SINGLE_UPLOAD)
        .locator('xpath=ancestor::div[@class="vjf_control"]');
    await expect(parent.locator('.vjf_array')).not.toBeVisible();
});

test('Pattern string', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await page.locator('input[name="/properties/patternString"]').fill('abc');
    await submitForm(page);

    await expect(page.locator('#result-container')).not.toBeAttached();

    await page.locator('input[name="/properties/patternString"]').clear();
    await page
        .locator('input[name="/properties/patternString"]')
        .fill('mystring-abc');
    await submitForm(page);

    let resultText = await page.locator('#result-container').textContent();
    let res = JSON.parse(resultText || '');
    expect(res['patternString']).toEqual('mystring-abc');
});

test('Edit Symbols', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    const parent = page
        .locator('input[name="/properties/obj-l/properties/auswahlfeld"]')
        .locator('xpath=ancestor::*[3]');
    const firstChild = parent.locator('> *').first();

    await expect(firstChild).toHaveClass(/vjf_htmlRenderer/);

    const icons = firstChild.locator('> * > *');
    const count = await icons.count();

    for (let i = 0; i < count; i++) {
        await expect(icons.nth(i)).toHaveAttribute('aria-label', /.+/);
    }
});

test('JSO-58', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    const helpText = page
        .locator('input[name="/properties/bool-mit-hilfe"]')
        .locator('xpath=following-sibling::*[1]')
        .locator('> *')
        .nth(1);

    await expect(helpText).toHaveText('i');
});

test('JSO-51', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');
    await page
        .locator('#vjf_control_for__properties_jso-51-arr > button')
        .click();
    await expect(
        page
            .locator('div[name="/properties/jso-51-arr"] .vjf_htmlRenderer')
            .nth(0)
    ).toHaveText('Pre html');
    await expect(
        page
            .locator('div[name="/properties/jso-51-arr"] .vjf_htmlRenderer')
            .nth(1)
    ).toHaveText('Post html');
});

test('JSO-31', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');
    await submitForm(page);

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['arrInArrPres']).toEqual([
        ['item1', 'item2'],
        ['item3', 'item4'],
    ]);
    expect(res['arrInArrDef']).toEqual([
        ['item1', 'item2'],
        ['item3', 'item4'],
    ]);
});

test('JSO-44', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await expect(
        page.locator('div[name="/properties/abhaengiges-array"]')
    ).not.toBeVisible();
    await page.locator('input[name="/properties/auswahlfeld"]').check();
    await expect(
        page.locator('div[name="/properties/abhaengiges-array"]')
    ).toBeVisible();
    await page
        .locator('div[name="/properties/abhaengiges-array"] button')
        .click();

    await expect(
        page.locator(
            'div[name="/properties/abhaengiges-array"] input[type="text"]'
        )
    ).not.toBeVisible();
    await page
        .locator(
            'div[name="/properties/abhaengiges-array"] input[type="checkbox"]'
        )
        .check();
    await expect(
        page.locator(
            'div[name="/properties/abhaengiges-array"] input[type="text"]'
        )
    ).toBeVisible();
});

test('JSO-37', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await expect(
        page.locator('input[name="/properties/jso-37-field1"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field2"]')
    ).not.toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field3"]')
    ).not.toBeVisible();

    await page.locator('input[name="/properties/jso-37-field1"]').fill('a');

    await expect(
        page.locator('input[name="/properties/jso-37-field1"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field2"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field3"]')
    ).not.toBeVisible();

    await page.locator('input[name="/properties/jso-37-field2"]').fill('a');

    await expect(
        page.locator('input[name="/properties/jso-37-field1"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field2"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field3"]')
    ).toBeVisible();

    await page.locator('input[name="/properties/jso-37-field1"]').clear();
    await expect(
        page.locator('input[name="/properties/jso-37-field1"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field2"]')
    ).not.toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field3"]')
    ).not.toBeVisible();

    await page.locator('input[name="/properties/jso-37-field1"]').fill('a');
    await page.locator('input[name="/properties/jso-37-field2"]').fill('a');

    await expect(
        page.locator('input[name="/properties/jso-37-field1"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field2"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field3"]')
    ).toBeVisible();

    await page.locator('input[name="/properties/jso-37-field2"]').clear();

    await expect(
        page.locator('input[name="/properties/jso-37-field1"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field2"]')
    ).toBeVisible();
    await expect(
        page.locator('input[name="/properties/jso-37-field3"]')
    ).not.toBeVisible();
});

test('JSO-39', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');
    await submitForm(page);

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['jso-39-multiselect']).toEqual(['option 2', 'option 3']);
    expect(res['jso-39-object']).toEqual({
        test: 'ABC',
        number: 14,
    });
    expect(res['jso-39-string']).toEqual('Test');
});

test('JSO-34', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    const containerId =
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c';

    await page.locator(`${containerId} > button`).click();
    await page.locator(`${containerId} > button`).click();
    await page
        .locator(
            `${containerId} > .list-group > div:first-child button.btn-outline-primary`
        )
        .click();
    await page
        .locator(
            `${containerId} > .list-group > div:first-child button.btn-outline-primary`
        )
        .click();
    await page
        .locator(
            `${containerId} > .list-group > div:nth-child(2) button.btn-outline-primary`
        )
        .click();
    await page
        .locator(
            `${containerId} > .list-group > div:nth-child(2) button.btn-outline-primary`
        )
        .click();

    await expect(
        page.locator(`${containerId} input[type="text"]`)
    ).not.toBeVisible();

    await page
        .locator(
            `${containerId} > .list-group > div:first-child .list-group > div:first-child input[type="checkbox"]`
        )
        .check();
    await expect(
        page.locator(
            `${containerId} > .list-group > div:first-child .list-group > div:first-child input[type="text"]`
        )
    ).toBeVisible();
    await expect(
        page.locator(
            `${containerId} > .list-group > div:first-child .list-group > div:nth-child(2) input[type="text"]`
        )
    ).not.toBeVisible();
    await expect(
        page.locator(
            `${containerId} > .list-group > div:nth-child(2) .list-group > div:nth-child(1) input[type="text"]`
        )
    ).not.toBeVisible();
    await expect(
        page.locator(
            `${containerId} > .list-group > div:nth-child(2) .list-group > div:nth-child(2) input[type="text"]`
        )
    ).not.toBeVisible();

    await page
        .locator(
            `${containerId} > .list-group > div:nth-child(2) .list-group > div:nth-child(2) input[type="checkbox"]`
        )
        .check();
    await expect(
        page.locator(
            `${containerId} > .list-group > div:first-child .list-group > div:first-child input[type="text"]`
        )
    ).toBeVisible();
    await expect(
        page.locator(
            `${containerId} > .list-group > div:first-child .list-group > div:nth-child(2) input[type="text"]`
        )
    ).not.toBeVisible();
    await expect(
        page.locator(
            `${containerId} > .list-group > div:nth-child(2) .list-group > div:nth-child(1) input[type="text"]`
        )
    ).not.toBeVisible();
    await expect(
        page.locator(
            `${containerId} > .list-group > div:nth-child(2) .list-group > div:nth-child(2) input[type="text"]`
        )
    ).toBeVisible();
});

test('JSO-17', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');
    await submitForm(page);

    const resultText = await page.locator('#result-container').textContent();
    const res = JSON.parse(resultText || '');
    expect(res['arrayWithDefaults']).toEqual(['default1', 'default2']);
});

test('JSO-23 & JSO-24', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await expect(
        page.locator(
            '.vjf_group .vjf_showOnWrapper button[type="submit"].btn-primary'
        )
    ).toBeVisible();
    await expect(
        page.locator(
            '.vjf_group .vjf_showOnWrapper button[type="reset"].btn-danger'
        )
    ).toBeVisible();

    const arrayId =
        'div[name="/properties/array-11d6266e4c57d4363b1f4ef6d72025f3a"]';

    await page.locator(`${arrayId} button[aria-label="Add Item"]`).click();
    await page.locator(`${arrayId} button[aria-label="Add Item"]`).click();
    await expect(
        page.locator(`${arrayId} input[type="text"]`)
    ).not.toBeVisible();
    await page
        .locator(
            `${arrayId} .list-group > div:nth-child(2) input[type="checkbox"]`
        )
        .check();
    await expect(
        page.locator(`${arrayId} input[type="text"]`)
    ).not.toBeVisible();
    await page
        .locator(
            `${arrayId} .list-group > div:nth-child(1) input[type="checkbox"]`
        )
        .check();
    await expect(
        page.locator(
            `${arrayId} .list-group > div:nth-child(1) input[type="text"]`
        )
    ).toBeVisible();
    await expect(
        page.locator(
            `${arrayId} .list-group > div:nth-child(2) input[type="text"]`
        )
    ).toBeVisible();
});

test('JSO-11', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await expect(
        page.locator(
            'input[name="/properties/upload-field-in-formcd69370e0708472482997b3da12ad3cc"]'
        )
    ).not.toBeVisible();
    await page
        .locator(
            'input[name="/properties/textline-in-form736e3a96a17d436996e5c8489cb9d102"]'
        )
        .fill('abc');
    await expect(
        page.locator(
            'label[for="vjf_control_for__properties_upload-field-in-formcd69370e0708472482997b3da12ad3cc"]'
        )
    ).toBeVisible();

    await page.reload();

    await expect(
        page.locator(
            'input[name="/properties/upload-field-in-formcd69370e0708472482997b3da12ad3cc"]'
        )
    ).not.toBeVisible();
    await page
        .locator(
            'input[name="/properties/selectionfield-in-formad0995330a9343efbb2e5488ab28e4a8"][value="option 11"]'
        )
        .check();
    await expect(
        page.locator(
            'label[for="vjf_control_for__properties_upload-field-in-formcd69370e0708472482997b3da12ad3cc"]'
        )
    ).toBeVisible();
});

test('JSO-7', async ({ page }) => {
    await page.goto('http://localhost:5173/reproduce?nonav=true');

    await page.locator('input[name="/properties/email"]').fill('test');
    await submitForm(page);

    await expect(page.locator('#result-container')).not.toBeAttached();

    await page.locator('input[name="/properties/email"]').clear();
    await page
        .locator('input[name="/properties/email"]')
        .fill('test@example.com');
    await submitForm(page);

    let resultText = await page.locator('#result-container').textContent();
    let res = JSON.parse(resultText || '');
    expect(res['email']).toEqual('test@example.com');
});
