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
        cy.visit('http://localhost:5173/');
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
            cy.get(id)
                .parent()
                .parent()
                .siblings()
                .eq(0)
                .should('have.text', 'Weeks');
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
            cy.get(id)
                .parent()
                .parent()
                .siblings()
                .eq(0)
                .should('have.text', 'Give me a name');
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
});
