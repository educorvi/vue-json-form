import { test, expect, Page } from '@playwright/test';

function submitForm(page) {
    return page.locator('button[type="submit"]').nth(-3).click();
}

const WAIT_TIME = 150;

const expectSelectOptions = async (
    page,
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

    let resultText = await page.locator('#result-container').textContent();
    let res = JSON.parse(resultText || '');
    expect('patternString' in res).toEqual(false);

    await page.locator('input[name="/properties/patternString"]').clear();
    await page
        .locator('input[name="/properties/patternString"]')
        .fill('mystring-abc');
    await submitForm(page);

    resultText = await page.locator('#result-container').textContent();
    res = JSON.parse(resultText || '');
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

    let resultText = await page.locator('#result-container').textContent();
    let res = JSON.parse(resultText || '');
    expect('email' in res).toEqual(false);

    await page.locator('input[name="/properties/email"]').clear();
    await page
        .locator('input[name="/properties/email"]')
        .fill('test@example.com');
    await submitForm(page);

    resultText = await page.locator('#result-container').textContent();
    res = JSON.parse(resultText || '');
    expect(res['email']).toEqual('test@example.com');
});
