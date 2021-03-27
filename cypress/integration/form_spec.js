const daten = {
    title: "Mr.",
    name: "Julian Pollinger",
    longText: "Das ist ein langer toller und\n mehrzeiliger Text\n\n Grüßle"
}

beforeEach(() => {
    cy.visit("http://localhost:8080/");
    cy.contains("Great Switch").click();
    cy.get("#name").type(daten.name);
    cy.get("#fancyness :nth-child(4) > input").click({force: true});
});

describe("Check if everything is there and v-models work", () => {
    it("Headquestions", () => {
        cy.get("#title").select(daten.title);
        cy.get("#fileupload");
        cy.get('[type="submit"]').first().click();
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
            expect(fancyness).to.equal("unicorn");

        });
    });
    it('Groups', () => {
        cy.get("#due_date");
        //Select four Stars in Rating
        cy.get('#rating :nth-child(4) > .b-rating-icon > .bi-star > g > path').click({force: true});
        cy.get('#due_date [type="date"]').type('2020-12-28');
        cy.get('#due_date [type="time"]').type('13:24');
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
            expect(due_date).to.equal("2020-12-28T13:24");
            expect(rating).to.equal(4);
            expect(description).to.equal(daten.longText);
            expect(weekday).to.deep.equal(["Monday", "Wednesday", "Sunday"]);
            expect(recurrence_interval).to.equal("12");
            expect(testArray).to.deep.equal(["Eintrag 1", "Eintrag 2"]);
            expect(tags).to.deep.equal(["smart", "cool", "super"]);

        });
    });

    it("Object", () => {
        cy.get('#group_selector > :nth-child(2) > span').click();
        cy.get('#group_selector_BV_option_1').check();
        cy.get('#petName').type('Richie');
        cy.get('#age').type('13');
        cy.get('#formGroup_flauschig > :nth-child(1) > .input-group > .custom-control > .custom-control-label > span').click();
        cy.get('#flauschig').check();
        cy.get('[type="submit"]').first().click();

        cy.get('#result_raw').should((div) => {
            const res = JSON.parse(div.text());
            const {
                "#/properties/group_selector": selector,
                "#/properties/testObject/properties/petName": petName,
                "#/properties/testObject/properties/age": petAge,
                "#/properties/testObject/properties/flauschig": petFluffy,
                "#/properties/testObject": pet
            } = res;

            expect(selector).to.equal("Object");
            expect(petName).to.equal("Richie");
            expect(petAge).to.equal("13");
            expect(petFluffy).to.equal(true);
            expect(pet).to.deep.equal({
                "petName": "Richie",
                "age": "13",
                "flauschig": true
            });


        });
    });
});

