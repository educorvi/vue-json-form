/// <reference types="cypress" />
/// <reference types="cypress-axe" />
function terminalLog(violations: any) {
    cy.task(
        'log',
        `${violations.length} accessibility violation${
            violations.length === 1 ? '' : 's'
        } ${violations.length === 1 ? 'was' : 'were'} detected`
    );
    // pluck specific keys to keep the table readable
    const violationData = violations.map(
        ({ id, impact, description, nodes }) => ({
            id,
            impact,
            description,
            nodes: nodes.length,
        })
    );

    cy.task('table', violationData);
}

describe('Check for accessibility issues', () => {
    const axeOptions = {
        rules: {
            'page-has-heading-one': { enabled: false },
        },
    };

    it('Showcase', () => {
        cy.visit('http://localhost:5173/showcase?nonav=true');
        cy.injectAxe();
        cy.checkA11y(null, axeOptions, terminalLog);
    });
    it('Reproduce', () => {
        cy.visit('http://localhost:5173/reproduce?nonav=true');
        cy.injectAxe();
        cy.checkA11y(null, axeOptions, terminalLog);
    });
});
