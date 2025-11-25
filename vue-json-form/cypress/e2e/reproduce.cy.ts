/// <reference types="cypress" />
import { register as registerCypressGrep } from '@cypress/grep';
registerCypressGrep();

function submitForm() {
    cy.get('button[type="submit"]').eq(-3).click();
}

const WAIT_TIME = 150;

const expectSelectOptions = (selector: string, expectedValues: string[]) => {
    cy.get(`${selector} option`)
        .should('have.length', expectedValues.length)
        .each(($option, index) => {
            expect($option.attr('value')).to.equal(expectedValues[index]);
        });
};

it('JSO-43', () => {
    const BOOL_FIELD = '#vjf_control_for__properties_jso-43_properties_bool';
    const HALLO_FIELD =
        '#vjf_control_for__properties_jso-43_properties_hallo input[value="du"]';
    const HALLO_FIELD_ICH =
        '#vjf_control_for__properties_jso-43_properties_hallo input[value="ich"]';
    const REQUIRED_FIELD =
        '#vjf_control_for__properties_jso-43_properties_abhaengiges-feld';
    const REQUIRED_LABEL =
        'label[for="vjf_control_for__properties_jso-43_properties_abhaengiges-feld"]';

    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get(REQUIRED_FIELD).should('not.exist');

    cy.get(BOOL_FIELD).check({ force: true });
    cy.get(REQUIRED_FIELD).should('exist').and('have.attr', 'required');
    cy.get(REQUIRED_LABEL).should('contain.text', '*');

    cy.get(BOOL_FIELD).uncheck({ force: true });
    cy.get(HALLO_FIELD_ICH).check({ force: true });
    cy.get(REQUIRED_FIELD).should('not.exist');

    cy.get(HALLO_FIELD).check({ force: true });
    cy.get(REQUIRED_FIELD).should('exist').and('have.attr', 'required');
    cy.get(REQUIRED_LABEL).should('contain.text', '*');

    cy.get(REQUIRED_FIELD).type('Hallo Pflichtfeld');
    submitForm();
    cy.get('#result-container').then((el) => {
        const res = JSON.parse(el.text());
        expect(res['jso-43']['abhaengiges-feld']).to.equal('Hallo Pflichtfeld');
        expect(res['jso-43']['hallo']).to.equal('du');
    });
});

it('JSO-79 (I)', () => {
    const FIRST_SELECT = '#vjf_control_for__properties_jso-79_properties_first';
    const SECOND_SELECT =
        '#vjf_control_for__properties_jso-79_properties_second';

    cy.visit('http://localhost:5173/reproduce?nonav=true');

    // Initial state: all options should be available
    expectSelectOptions(SECOND_SELECT, ['a1', 'a2', 'b1']);

    // Select 'A': only 'a' options should be available
    cy.get(FIRST_SELECT).select('A');
    cy.wait(WAIT_TIME);
    expectSelectOptions(SECOND_SELECT, ['a1', 'a2']);

    // Select 'B': only 'b' options should be available
    cy.get(FIRST_SELECT).select('B');
    cy.wait(WAIT_TIME);
    expectSelectOptions(SECOND_SELECT, ['b1']);

    cy.get(FIRST_SELECT).select('A');
    cy.get(SECOND_SELECT).select('a1');
    cy.get(FIRST_SELECT).select('B');
    cy.wait(WAIT_TIME);
    submitForm();
    cy.get('#result-container').then((el) => {
        let res = JSON.parse(el.text());
        expect(res['jso-79']['second']).to.be.undefined;
    });
});

it('JSO-79-II', () => {
    const BASE = '#vjf_control_for__properties_jso-79-ii_properties';
    const INDEPENDENT_SELECT = `${BASE}_unabhaengige-frage`;
    const DEPENDENT_SELECT = `${BASE}_abhaengige-frage`;
    const NAME_SELECT = `${BASE}_wie-heisst-du`;

    cy.visit('http://localhost:5173/reproduce?nonav=true');

    expectSelectOptions(DEPENDENT_SELECT, ['1', '2', '3']);

    cy.get(INDEPENDENT_SELECT).select('a');
    cy.wait(WAIT_TIME);
    expectSelectOptions(DEPENDENT_SELECT, ['1', '3']);

    cy.get(DEPENDENT_SELECT).select('1');

    cy.get(NAME_SELECT).select('Henrik');
    cy.wait(WAIT_TIME);
    expectSelectOptions(DEPENDENT_SELECT, ['2', '3']);
    cy.get(DEPENDENT_SELECT).should('have.value', null);

    cy.get(DEPENDENT_SELECT).select('3');
    submitForm();
    cy.get('#result-container').then((el) => {
        const res = JSON.parse(el.text());
        expect(res['jso-79-ii']['unabhaengige-frage']).to.equal('a');
        expect(res['jso-79-ii']['wie-heisst-du']).to.equal('Henrik');
        expect(res['jso-79-ii']['abhaengige-frage']).to.equal('3');
    });
});

it('JSO-79-III', () => {
    const BASE = '#vjf_control_for__properties_jso-79-iii_properties';
    const INDEPENDENT_GROUP = `${BASE}_unabhaengige-frage`;
    const DEPENDENT_SELECT = `${BASE}_abhaengige-frage`;
    const NAME_SELECT = `${BASE}_wie-heisst-du`;

    const toggleIndependent = (value: string, checked: boolean) => {
        const selector = `${INDEPENDENT_GROUP} input[value="${value}"]`;
        if (checked) {
            cy.get(selector).check({ force: true });
        } else {
            cy.get(selector).uncheck({ force: true });
        }
    };

    cy.visit('http://localhost:5173/reproduce?nonav=true');

    expectSelectOptions(DEPENDENT_SELECT, ['3']);

    toggleIndependent('a', true);
    cy.wait(WAIT_TIME);
    expectSelectOptions(DEPENDENT_SELECT, ['3', '1']);

    cy.get(NAME_SELECT).select('Henrik');
    cy.wait(WAIT_TIME);
    expectSelectOptions(DEPENDENT_SELECT, ['2', '3', '1']);

    toggleIndependent('a', false);
    cy.wait(WAIT_TIME);
    expectSelectOptions(DEPENDENT_SELECT, ['2', '3', '1']);

    toggleIndependent('b', true);
    toggleIndependent('c', true);
    cy.wait(WAIT_TIME);
    expectSelectOptions(DEPENDENT_SELECT, ['2', '3', '1', '4']);

    cy.get(DEPENDENT_SELECT).select('4');
    submitForm();
    cy.get('#result-container').then((el) => {
        const res = JSON.parse(el.text());
        expect(res['jso-79-iii']['unabhaengige-frage']).to.deep.equal([
            'b',
            'c',
        ]);
        expect(res['jso-79-iii']['wie-heisst-du']).to.equal('Henrik');
        expect(res['jso-79-iii']['abhaengige-frage']).to.equal('4');
    });
});

it('JSO-79-IV', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get('#vjf_control_for__properties_string-dep-required-2').should(
        'not.have.attr',
        'required'
    );
    cy.get(
        'label[for="vjf_control_for__properties_string-dep-required-2"] span'
    ).should('not.include.text', '*');

    cy.get('#vjf_control_for__properties_string-dep-required').type('Test');
    cy.get('#vjf_control_for__properties_string-dep-required-2').should(
        'have.attr',
        'required'
    );
    cy.get(
        'label[for="vjf_control_for__properties_string-dep-required-2"] span'
    ).should('include.text', '*');

    cy.get('#vjf_control_for__properties_string-dep-required').clear();
    cy.get('#vjf_control_for__properties_string-dep-required-2').should(
        'not.have.attr',
        'required'
    );
    cy.get(
        'label[for="vjf_control_for__properties_string-dep-required-2"] span'
    ).should('not.include.text', '*');
});

it('JSO-68', () => {
    const ARRAY_CONTAINER = '#vjf_control_for__properties_multiFileUpload1';
    const SINGLE_UPLOAD = '#vjf_control_for__properties_multiFileUpload2';

    cy.visit('http://localhost:5173/reproduce?nonav=true');

    cy.get(ARRAY_CONTAINER).should('exist').and('have.class', 'vjf_array');
    cy.get(`${ARRAY_CONTAINER} button[aria-label="Add Item"]`).should('exist');

    cy.get(SINGLE_UPLOAD)
        .should('exist')
        .and('have.attr', 'type', 'file')
        .and('have.attr', 'multiple');
    cy.get(SINGLE_UPLOAD)
        .parents('.vjf_control')
        .find('.vjf_array')
        .should('not.exist');
});

it('Pattern string', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');

    cy.get("input[name='/properties/patternString']").type('abc');
    submitForm();
    cy.get('#result-container').then((el) => {
        let res = JSON.parse(el.text());
        expect('patternString' in res).to.equal(false);
        cy.get("input[name='/properties/patternString']").clear();
        cy.get("input[name='/properties/patternString']").type('mystring-abc');
        submitForm();
        cy.get('#result-container').then((el) => {
            let res = JSON.parse(el.text());
            expect(res['patternString']).to.equal('mystring-abc');
        });
    });
});

// JSO-64 Skipped for now

it('Edit Symbols', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get('input[name="/properties/obj-l/properties/auswahlfeld"]')
        .parent()
        .parent()
        .parent()
        .children()
        .eq(0)
        .then((el) => {
            expect(el).has.class('vjf_htmlRenderer');
            const chs = el.children().eq(0).children().get();
            chs.forEach((h) => {
                expect(h).has.attr('aria-label');
            });
        });
});

it('JSO-58', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get('input[name="/properties/bool-mit-hilfe"]')
        .siblings()
        .eq(0)
        .children()
        .eq(1)
        .should('have.text', 'i');
});

it('JSO-51', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get('div[name="/properties/jso-51-arr"] .vjf_htmlRenderer')
        .eq(0)
        .should('have.text', 'Pre html');
    cy.get('div[name="/properties/jso-51-arr"] .vjf_htmlRenderer')
        .eq(1)
        .should('have.text', 'Post html');
});

it('JSO-31', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    submitForm();
    cy.get('#result-container').then((el) => {
        let res = JSON.parse(el.text());
        expect(res['arrInArrPres']).to.deep.equal([
            ['item1', 'item2'],
            ['item3', 'item4'],
        ]);
        expect(res['arrInArrDef']).to.deep.equal([
            ['item1', 'item2'],
            ['item3', 'item4'],
        ]);
    });
});

it('JSO-44', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get('div[name="/properties/abhaengiges-array"]').should('not.exist');
    cy.get('input[name="/properties/auswahlfeld"]').check();
    cy.get('div[name="/properties/abhaengiges-array"]').should('exist');
    cy.get(
        'div[name="/properties/abhaengiges-array"] input[type="text"]'
    ).should('not.exist');
    cy.get(
        'div[name="/properties/abhaengiges-array"] input[type="checkbox"]'
    ).check();
    cy.get(
        'div[name="/properties/abhaengiges-array"] input[type="text"]'
    ).should('exist');
});

it('JSO-37', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get('input[name="/properties/jso-37-field1"]').should('exist');
    cy.get('input[name="/properties/jso-37-field2"]').should('not.exist');
    cy.get('input[name="/properties/jso-37-field3"]').should('not.exist');

    cy.get('input[name="/properties/jso-37-field1"]').type('a');

    cy.get('input[name="/properties/jso-37-field1"]').should('exist');
    cy.get('input[name="/properties/jso-37-field2"]').should('exist');
    cy.get('input[name="/properties/jso-37-field3"]').should('not.exist');

    cy.get('input[name="/properties/jso-37-field2"]').type('a');

    cy.get('input[name="/properties/jso-37-field1"]').should('exist');
    cy.get('input[name="/properties/jso-37-field2"]').should('exist');
    cy.get('input[name="/properties/jso-37-field3"]').should('exist');

    cy.get('input[name="/properties/jso-37-field1"]').clear();
    cy.get('input[name="/properties/jso-37-field1"]').should('exist');
    cy.get('input[name="/properties/jso-37-field2"]').should('not.exist');
    cy.get('input[name="/properties/jso-37-field3"]').should('not.exist');

    cy.get('input[name="/properties/jso-37-field1"]').type('a');
    cy.get('input[name="/properties/jso-37-field2"]').type('a');

    cy.get('input[name="/properties/jso-37-field1"]').should('exist');
    cy.get('input[name="/properties/jso-37-field2"]').should('exist');
    cy.get('input[name="/properties/jso-37-field3"]').should('exist');

    cy.get('input[name="/properties/jso-37-field2"]').clear();

    cy.get('input[name="/properties/jso-37-field1"]').should('exist');
    cy.get('input[name="/properties/jso-37-field2"]').should('exist');
    cy.get('input[name="/properties/jso-37-field3"]').should('not.exist');
});

it('JSO-39', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    submitForm();
    cy.get('#result-container').then((el) => {
        let res = JSON.parse(el.text());
        expect(res['jso-39-multiselect']).to.deep.equal([
            'option 2',
            'option 3',
        ]);
        expect(res['jso-39-object']).to.deep.equal({
            test: 'ABC',
            number: 14,
        });
        expect(res['jso-39-string']).to.equal('Test');
    });
});

it('JSO-34', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > button'
    ).click();
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > button'
    ).click();
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:first button.btn-outline-primary'
    ).click();
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:first button.btn-outline-primary'
    ).click();
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:nth-child(2) button.btn-outline-primary'
    ).click();
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:nth-child(2) button.btn-outline-primary'
    ).click();
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c input[type="text"]'
    ).should('not.exist');

    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:first .list-group > div:first input[type="checkbox"]'
    ).check();
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:first .list-group > div:first input[type="text"]'
    ).should('exist');
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:first .list-group > div:nth-child(2) input[type="text"]'
    ).should('not.exist');
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:nth-child(2) .list-group > div:nth-child(1) input[type="text"]'
    ).should('not.exist');
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:nth-child(2) .list-group > div:nth-child(2) input[type="text"]'
    ).should('not.exist');

    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:nth-child(2) .list-group > div:nth-child(2) input[type="checkbox"]'
    ).check();
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:first .list-group > div:first input[type="text"]'
    ).should('exist');
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:first .list-group > div:nth-child(2) input[type="text"]'
    ).should('not.exist');
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:nth-child(2) .list-group > div:nth-child(1) input[type="text"]'
    ).should('not.exist');
    cy.get(
        '#vjf_control_for__properties_array141d1d356e40b4062ac2b1476ff52648c > .list-group > div:nth-child(2) .list-group > div:nth-child(2) input[type="text"]'
    ).should('exist');
});

it('JSO-17', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    submitForm();
    cy.get('#result-container').then((el) => {
        let res = JSON.parse(el.text());
        expect(res['arrayWithDefaults']).to.deep.equal([
            'default1',
            'default2',
        ]);
    });
});

it('JSO-23 & JSO-24', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get('.vjf_showOnWrapper button[type="submit"].btn-primary').should(
        'exist'
    );
    cy.get('.vjf_showOnWrapper button[type="reset"].btn-danger').should(
        'exist'
    );

    cy.get(
        'div[name="/properties/array-11d6266e4c57d4363b1f4ef6d72025f3a"] button[aria-label="Add Item"]'
    ).click();
    cy.get(
        'div[name="/properties/array-11d6266e4c57d4363b1f4ef6d72025f3a"] button[aria-label="Add Item"]'
    ).click();
    cy.get(
        'div[name="/properties/array-11d6266e4c57d4363b1f4ef6d72025f3a"] input[type="text"]'
    ).should('not.exist');
    cy.get(
        'div[name="/properties/array-11d6266e4c57d4363b1f4ef6d72025f3a"] .list-group > div:nth-child(2) input[type="checkbox"]'
    ).check();
    cy.get(
        'div[name="/properties/array-11d6266e4c57d4363b1f4ef6d72025f3a"] input[type="text"]'
    ).should('not.exist');
    cy.get(
        'div[name="/properties/array-11d6266e4c57d4363b1f4ef6d72025f3a"] .list-group > div:nth-child(1) input[type="checkbox"]'
    ).check();
    cy.get(
        'div[name="/properties/array-11d6266e4c57d4363b1f4ef6d72025f3a"] .list-group > div:nth-child(1) input[type="text"]'
    ).should('exist');
    cy.get(
        'div[name="/properties/array-11d6266e4c57d4363b1f4ef6d72025f3a"] .list-group > div:nth-child(2) input[type="text"]'
    ).should('exist');
});

// JSO-25 & JSO-12 skipped for redundancy

it('JSO-11', () => {
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get(
        'input[name="/properties/upload-field-in-formcd69370e0708472482997b3da12ad3cc"]'
    ).should('not.exist');
    cy.get(
        'input[name="/properties/textline-in-form736e3a96a17d436996e5c8489cb9d102"]'
    ).type('abc');
    cy.get(
        'input[name="/properties/upload-field-in-formcd69370e0708472482997b3da12ad3cc"]'
    ).should('exist');
    cy.reload();
    cy.get(
        'input[name="/properties/upload-field-in-formcd69370e0708472482997b3da12ad3cc"]'
    ).should('not.exist');
    cy.get(
        'input[name="/properties/selectionfield-in-formad0995330a9343efbb2e5488ab28e4a8"][text="option 11"]'
    ).check();
    cy.get(
        'input[name="/properties/upload-field-in-formcd69370e0708472482997b3da12ad3cc"]'
    ).should('exist');
});

// JSO-14 skipped for redundancy

it('JSO-7', () => {
    //     Incomplete
    cy.visit('http://localhost:5173/reproduce?nonav=true');
    cy.get('input[name="/properties/email"]').type('test');
    submitForm();
    cy.get('#result-container').then((el) => {
        let res = JSON.parse(el.text());
        expect('email' in res).to.equal(false);

        cy.get('input[name="/properties/email"]').clear();
        cy.get('input[name="/properties/email"]').type('test@example.com');
        submitForm();

        cy.get('#result-container').then((el) => {
            let res = JSON.parse(el.text());
            expect(res['email']).to.equal('test@example.com');
        });
    });
});
