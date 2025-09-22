/// <reference types="cypress" />
describe('Structure', () => {
    function checkRadios(containerID: string, values: string[]) {
        cy.get(containerID).children().should('have.length', values.length);
        values.forEach((value, index) => {
            cy.get(containerID)
                .children()
                .eq(index)
                .children()
                .first()
                .should('have.value', value)
                .should('have.attr', 'type', 'radio');
        });
    }

    beforeEach(() => {
        cy.visit('http://localhost:5173?variant=showcase/');
    });

    it('Switch', () => {
        const checkbox = cy.get('#vjf_control_for__properties_done');
        checkbox.should('exist');
        // check if is checkbox
        checkbox.should('have.attr', 'type', 'checkbox');
    });
    it('Title', () => {
        const id = 'select#vjf_control_for__properties_title';
        cy.get(id).should('exist');
        cy.get(id).children().should('have.length', 4);
        cy.get(id).children().eq(0).should('have.value', 'Mrs.');
        cy.get(id).children().eq(1).should('have.value', 'Mr.');
        cy.get(id).children().eq(2).should('have.value', 'Ms.');
        cy.get(id).children().eq(3).should('have.value', 'Dr.');
    });
    it('Fanciness', () => {
        const id = 'div#vjf_control_for__properties_fanciness';
        cy.get(id).should('exist');

        checkRadios(id, ['fancy', 'fancier', 'fanciest', 'unicorn']);
    });
    it('Fileupload', () => {
        const id = 'input#vjf_control_for__properties_fileupload';
        cy.get(id).should('exist');
        cy.get(id).should('have.attr', 'type', 'file');
    });
    it('Group selector', () => {
        const id = '#vjf_control_for__properties_group_selector';
        cy.get(id).should('exist');
        cy.get(`${id} > label`).should('exist');
    });
    describe('Group', () => {
        it('dueDate', () => {
            const id = 'input#vjf_control_for__properties_due_date';
            cy.get(id).should('exist');
            cy.get(id).should('have.attr', 'type', 'datetime-local');
        });
        it('Rating', () => {
            const id = 'input#vjf_control_for__properties_rating';
            cy.get(id).should('exist');
            cy.get(id).should('have.attr', 'type', 'range');
            cy.get(id).should('have.attr', 'min', '0');
            cy.get(id).should('have.attr', 'max', '5');
            cy.get(id).should('have.attr', 'step', '1');
            cy.get(id).should('have.value', 3);
        });
        it('Description', () => {
            const id = 'textarea#vjf_control_for__properties_description';
            cy.get(id).should('exist');
            cy.get(id).should(
                'have.value',
                'This good text was set as default'
            );
            cy.get(id).should('have.attr', 'rows', '2');
        });
        it('Teststring', () => {
            const id = 'input#vjf_control_for__properties_teststring';
            cy.get(id).should('exist');
            cy.get(id).should('have.attr', 'type', 'text');
        });
        it('Weekdays', () => {
            const id = 'div#vjf_control_for__properties_weekdays';
            cy.get(id).should('exist');
            cy.get(id).children().should('have.length', 7);

            const weekdays = [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
            ];
            weekdays.forEach((day, index) => {
                cy.get(id)
                    .children()
                    .eq(index)
                    .children()
                    .first()
                    .should('have.value', day)
                    .should('have.attr', 'type', 'checkbox');
            });
        });
        it('RecurrenceInterval', () => {
            const id = 'input#vjf_control_for__properties_recurrence_interval';
            cy.get(id).should('exist');
            cy.get(id).should('have.attr', 'type', 'number');
            cy.get(id).should('have.attr', 'step', '1');
            cy.get(id).siblings().eq(0).should('have.text', 'Weeks');
        });
        it('TestArray', () => {
            const id = 'div[name="/properties/testArray"]';
            cy.get(id).should('exist');
            cy.get(`${id} input`).should('exist');
            cy.get(`${id} input`).should(
                'have.attr',
                'placeholder',
                'This is a placeholder'
            );
            cy.get(`${id} button[aria-label='Add Item']`).should('exist');
        });
    });
    describe('Object', () => {
        beforeEach(() => {
            cy.get('#vjf_control_for__properties_group_selector')
                .children()
                .eq(3)
                .click();
        });

        it('name', () => {
            const id =
                'input#vjf_control_for__properties_testObject_properties_petName';
            cy.get(id).should('exist');
            cy.get(id).should('have.attr', 'type', 'text');
        });

        it('age', () => {
            const id =
                'input#vjf_control_for__properties_testObject_properties_age';
            cy.get(id).should('exist');
            cy.get(id).should('have.attr', 'type', 'number');
            cy.get(id).should('have.attr', 'step', '1');
            cy.get(id).should('have.attr', 'min', '0');
            cy.get(id).should('have.attr', 'max', '100');
            cy.get(id).should('have.value', 10);
        });

        it('flauschig', () => {
            const id =
                'input#vjf_control_for__properties_testObject_properties_flauschig';
            cy.get(id).should('exist');
            cy.get(id).should('have.attr', 'type', 'checkbox');
        });
    });

    it('HTML text', () => {
        const id = 'span.vjf_htmlRenderer > p ';
        cy.get(id).should('exist');
        cy.get(id).should(
            'have.html',
            'Ich bin ein <strong class="text-primary">HTML</strong> Text'
        );
    });

    it('Tags', () => {
        const id = 'div#vjf_control_for__properties_tags';
        cy.get(id).should('exist');
    });

    it('Form Buttons', () => {
        cy.get('button[type="submit"]').should('exist');
        cy.get('button[type="reset"]').should('exist');
    });

    it('Fancy Unicorn', () => {
        cy.get('#vjf_control_for__properties_fanciness input').eq(3).check();
        cy.get('input[type=range]#vjf_control_for__properties_rating')
            .invoke('val', 4)
            .trigger('input');
        const id = 'span.vjf_htmlRenderer > h3';
        cy.get(id).should(
            'have.html',
            'You are a very fancy unicorn my friend...'
        );
        cy.get(id).should(
            'have.attr',
            'style',
            'background-image:linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red);-webkit-background-clip:text;color:transparent'
        );
    });
});

describe('Button functions', () => {
    beforeEach(() => {
        cy.visit('http://localhost:5173/');
    });

    it('submit with missing fields', () => {
        cy.get('#vjf_control_for__properties_name').type('Test User');
        cy.get('button[type="submit"]:not([formnovalidate])').click();
        cy.get('#result-container').then(($el) => {
            const rawText = $el.text();
            const json = JSON.parse(rawText);

            expect(json).to.deep.equal({});
        });
    });
    it('submit with missing fields and novalidate', () => {
        cy.get('#vjf_control_for__properties_name').type('Test User');
        cy.get('button[type="submit"][formnovalidate]').click();
        cy.get('#result-container').then(($el) => {
            const rawText = $el.text();
            const json = JSON.parse(rawText);

            expect(json['name']).to.equal('Test User');
        });
    });
    it('reset form', () => {
        cy.get('#vjf_control_for__properties_name').type('Test User');
        cy.get('button[type="reset"]').click();
        cy.get('#vjf_control_for__properties_name').should('have.value', '');
    });

    it('submit with data (group)', function () {
        cy.get('#vjf_control_for__properties_done').check();
        cy.get('#vjf_control_for__properties_title').select('Mr.');
        cy.get('#vjf_control_for__properties_name').type('Test User 2');
        cy.get('#vjf_control_for__properties_fanciness input').eq(3).check();
        cy.get('#vjf_control_for__properties_due_date').type(
            '2000-12-11T14:24'
        );
        cy.get('#vjf_control_for__properties_description').click();
        cy.get('#vjf_control_for__properties_teststring').type('test');
        cy.get('#vjf_control_for__properties_weekdays input').eq(0).check();
        cy.get('#vjf_control_for__properties_weekdays input').eq(4).check();
        cy.get('#vjf_control_for__properties_recurrence_interval').type('4');
        cy.get('#vjf_control_for__properties_testArray input')
            .eq(0)
            .type('Hello');
        cy.get('#vjf_control_for__properties_testArray input')
            .eq(1)
            .type('World');
        cy.get(
            '#vjf_control_for__properties_testArray > .btn-outline-primary'
        ).click();
        cy.get('#vjf_control_for__properties_testArray input')
            .eq(2)
            .type('I am third!');
        cy.get('.btn-primary').click();

        cy.get('#result-container').then(($el) => {
            const rawText = $el.text();
            const json = JSON.parse(rawText);

            expect(json['done']).to.equal(true);
            expect(json['title']).to.equal('Mr.');
            expect(json['name']).to.equal('Test User 2');
            expect(json['fanciness']).to.equal('unicorn');
            expect(json['due_date']).to.equal('2000-12-11T14:24');
            expect(json['description']).to.equal(
                'This good text was set as default'
            );
            expect(json['teststring']).to.equal('test');
            expect(json['weekdays']).to.deep.equal(['Monday', 'Friday']);
            expect(json['recurrence_interval']).to.equal(4);
            expect(json['testArray']).to.deep.equal([
                'Hello',
                'World',
                'I am third!',
            ]);
        });
    });

    it('submit with data (object)', function () {
        cy.get('#vjf_control_for__properties_done').check();
        cy.get('#vjf_control_for__properties_title').select('Mr.');
        cy.get('#vjf_control_for__properties_name').type('Test User 2');
        cy.get('#vjf_control_for__properties_fanciness input').eq(3).check();

        cy.get('#vjf_control_for__properties_group_selector label')
            .eq(1)
            .click();

        cy.get(
            '#vjf_control_for__properties_testObject_properties_petName'
        ).type('Richie');
        cy.get(
            '#vjf_control_for__properties_testObject_properties_age'
        ).clear();
        cy.get('#vjf_control_for__properties_testObject_properties_age').type(
            '15'
        );
        cy.get(
            '#vjf_control_for__properties_testObject_properties_flauschig'
        ).check();

        cy.get('.btn-primary').click();

        cy.get('#result-container').then(($el) => {
            const rawText = $el.text();
            const json = JSON.parse(rawText);

            expect(json['done']).to.equal(true);
            expect(json['title']).to.equal('Mr.');
            expect(json['name']).to.equal('Test User 2');
            expect(json['fanciness']).to.equal('unicorn');

            expect(json['testObject']).to.deep.equal({
                petName: 'Richie',
                age: 15,
                flauschig: true,
            });
        });
    });
});
