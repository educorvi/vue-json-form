const daten = {
    title: "Mr.",
    name: "Julian Pollinger"
}

//@Todo More Tests
describe('Tests', () => {
    it('loads', () => {
        cy.visit("/");
    });
    it('Everything\'s there ', () => {
        cy.contains("Great Switch").click();
        cy.get("#title").select(daten.title);
        cy.get("#name").type(daten.name);
        cy.get("#fancyness").first().click();
        cy.get("#fileupload");


        cy.get('[type="submit"]').first().click();
    });
    it('Check results', () => {
        cy.get('#result_raw').should((div) => {
            const res = JSON.parse(div.text());
            expect(res["#/properties/name"]).to.equal(daten.name);
            expect(res["#/properties/title"]).to.equal(daten.title);
            expect(res["#/properties/done"]).to.be.true;
        });
    });
})
