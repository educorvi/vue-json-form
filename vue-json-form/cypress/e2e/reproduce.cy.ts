/// <reference types="cypress" />

function submitForm() {
    cy.get('button[type="submit"]').eq(-3).click();
}

it('JSO-43', function () {
    cy.visit('http://localhost:5173?variant=reproduce');
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

it('Pattern string', () => {
    cy.visit('http://localhost:5173?variant=reproduce');

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
    cy.visit('http://localhost:5173?variant=reproduce');
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
    cy.visit('http://localhost:5173?variant=reproduce');
    cy.get('input[name="/properties/bool-mit-hilfe"]')
        .siblings()
        .eq(0)
        .children()
        .eq(1)
        .should('have.text', 'i');
});

it('JSO-51', () => {
    cy.visit('http://localhost:5173?variant=reproduce');
    cy.get('div[name="/properties/jso-51-arr"] .vjf_htmlRenderer')
        .eq(0)
        .should('have.text', 'Pre html');
    cy.get('div[name="/properties/jso-51-arr"] .vjf_htmlRenderer')
        .eq(1)
        .should('have.text', 'Post html');
});

it('JSO-31', () => {
    cy.visit('http://localhost:5173?variant=reproduce');
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
    cy.visit('http://localhost:5173?variant=reproduce');
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
    cy.visit('http://localhost:5173?variant=reproduce');
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
    cy.visit('http://localhost:5173?variant=reproduce');
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
    cy.visit('http://localhost:5173?variant=reproduce');
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
    cy.visit('http://localhost:5173?variant=reproduce');
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
    cy.visit('http://localhost:5173?variant=reproduce');
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
    cy.visit('http://localhost:5173?variant=reproduce');
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
    cy.visit('http://localhost:5173?variant=reproduce');
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
