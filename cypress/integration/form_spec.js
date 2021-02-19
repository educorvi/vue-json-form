const daten = {
    title: "Mr.",
    name: "Julian Pollinger",
    longText: "Das ist ein langer toller und\n mehrzeiliger Text\n\n Grüßle"
}

describe("Head", () => {
    it("Everything's there and fill", () => {
        cy.visit("/");
        cy.contains("Great Switch").click();
        cy.get("#title").select(daten.title);
        cy.get("#name").type(daten.name);
        cy.get("#fancyness").first().click();
        cy.get("#fileupload");
    });
    it('Check results', () => {
        cy.get('#result_raw').should((div) => {
            const res = JSON.parse(div.text());
            const {
                "#/properties/name": name,
                "#/properties/title": title,
                "#/properties/done": done,
                "#/properties/fancyness": fancyness
            } = res;
            expect(name).to.equal(daten.name);
            expect(title).to.equal(daten.title);
            expect(done).to.be.true;
            expect(fancyness).to.equal("fanciest");

        });
    });
});

describe('Groups', () => {
    it('Everything\'s there and fill', () => {
        cy.visit("/");
        cy.get("#due_date");
        //Select four Stars in Rating
        cy.get(':nth-child(4) > .b-rating-icon > .bi-star > g > path').click({force: true});
        cy.get('[type="date"]').type('2021-12-28');
        cy.get('[type="time"]').type('23:24');
        cy.get('#description').type(daten.longText);
        cy.get("#weekday_BV_option_0").check({force: true});
        cy.get("#weekday_BV_option_2").check({force: true});
        cy.get("#weekday_BV_option_6").check({force: true});
        cy.get('#recurrence_interval').type('12');
        cy.get('.bi-plus').click();
        cy.get('#items').type('Eintrag 1');
        cy.get('#testArray > .btn-outline-primary').click();
        cy.get(':nth-child(2) > :nth-child(1) > #formGroup_items > :nth-child(1) > .input-group > #items').type('Eintrag 2');
        cy.get('#tags___input__').type('smart{enter}cool{enter}super{enter}');

        cy.get('[type="submit"]').first().click();
    });
    it('Check results', () => {
        cy.get('#result_raw').should((div) => {
            const res = JSON.parse(div.text());
            const {
                "#/properties/rating": rating,
                "#/properties/weekday": weekday,
                "#/properties/testArray": testArray,
                "#/properties/due_date": due_date,
                "#/properties/description": description,
                "#/properties/recurrence_interval": recurrence_interval,
                "#/properties/tags": tags,
            } = res;
            expect(due_date).to.equal("2021-12-28T23:24");
            expect(rating).to.equal(4);
            expect(description).to.equal(daten.longText);
            expect(weekday).to.deep.equal(["Monday", "Wednesday", "Sunday"]);
            expect(recurrence_interval).to.equal("12");
            expect(testArray).to.deep.equal(["Eintrag 1", "Eintrag 2"]);
            expect(tags).to.deep.equal(["smart", "cool", "super"]);

        });
    });
});

describe('Object', () => {
    it('Everything\'s there and fill', () => {
        cy.visit("/");
        //
    });
    it('Check results', () => {
        cy.get('#result_raw').should((div) => {
            const res = JSON.parse(div.text());
            const {
                "#/properties/name": name,
                "#/properties/title": title,
                "#/properties/done": done,
                "#/properties/fancyness": fancyness,
                "#/properties/rating": rating,
                "#/properties/weekday": weekday,
                "#/properties/testArray": testArray,
                "#/properties/due_date": due_date,
                "#/properties/description": description,
                "#/properties/recurrence_interval": recurrence_interval,
                "#/properties/tags": tags,
            } = res;

        });
    });
});
