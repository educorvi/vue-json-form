/// <reference types="cypress" />
describe('Check for accessibility issues', () => {
    it('Showcase', () => {
        cy.visit('http://localhost:5173?variant=showcase');
        cy.injectAxe();
        cy.checkA11y();
    });
    it('Reproduce', () => {
        cy.visit('http://localhost:5173?variant=reproduce');
        cy.injectAxe();
        cy.checkA11y();
    });
});
