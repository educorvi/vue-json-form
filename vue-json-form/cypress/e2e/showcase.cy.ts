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

    it('Switch', () => {
        cy.visit('http://localhost:5173/');
        const checkbox = cy.get('#vjf_control_for__properties_done');
        checkbox.should('exist');
        // check if is checkbox
        checkbox.should('have.attr', 'type', 'checkbox');
    });
    it('Title', () => {
        cy.visit('http://localhost:5173/');
        const id = 'select#vjf_control_for__properties_title';
        cy.get(id).should('exist');
        cy.get(id).children().should('have.length', 4);
        cy.get(id).children().eq(0).should('have.value', 'Mrs.');
        cy.get(id).children().eq(1).should('have.value', 'Mr.');
        cy.get(id).children().eq(2).should('have.value', 'Ms.');
        cy.get(id).children().eq(3).should('have.value', 'Dr.');
    });
    it('Fanciness', () => {
        cy.visit('http://localhost:5173/');
        const id = 'div#vjf_control_for__properties_fanciness';
        cy.get(id).should('exist');

        checkRadios(id, ['fancy', 'fancier', 'fanciest', 'unicorn']);
    });
    it('Fileupload', () => {
        cy.visit('http://localhost:5173/');
        const id = 'input#vjf_control_for__properties_fileupload';
        cy.get(id).should('exist');
        cy.get(id).should('have.attr', 'type', 'file');
    });
    it('Group selector', () => {
        cy.visit('http://localhost:5173/');
        const id = '#vjf_control_for__properties_group_selector';
        cy.get(id).should('exist');
    });
});
