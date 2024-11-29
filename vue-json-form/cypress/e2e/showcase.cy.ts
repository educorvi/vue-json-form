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
        cy.injectAxe();
    });

    it('Check entire page for a11y issues', () => {
        cy.checkA11y();
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
});
