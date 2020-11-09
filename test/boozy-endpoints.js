const knex = require("knex");
const app = require("../src/app");
const { makeDrinkArray } = require("./boozy-fixtures");

describe("Boozy Endpoints", function () {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () =>
    db.raw("TRUNCATE drinks RESTART IDENTITY CASCADE")
  );

  afterEach("cleanup", () =>
    db.raw("TRUNCATE drinks RESTART IDENTITY CASCADE")
  );

  describe(`GET /api/drinks`, () => {
    context(`Given no drinks`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/drinks").expect(200, []);
      });
    });

    context("Given there are drinks in the database", () => {
      const testDrinks = makeDrinkArray();

      beforeEach("insert articles", () => {
        return db
          .into("drinks")
          .insert(testDrinks)
          .then(() => {
            return db.into("drinks").insert(testDrinks);
          });
      });

      it("responds with 200 and all of the articles", () => {
        return supertest(app).get("/api/articles").expect(200, testDrinks);
      });
    });
  });

  describe(`GET /api/drinks/:drink_id`, () => {
    context(`Given no drinks`, () => {
      it(`responds with 404`, () => {
        const drinkId = 123456;
        return supertest(app)
          .get(`/api/drinks/${drinkId}`)
          .expect(404, { error: { message: `Drink Not Found` } });
      });
    });

    context("Given there are articles in the database", () => {
      const testDrinks = makeDrinkArray();

      beforeEach("insert drinks", () => {
        return db
          .into("drinks")
          .insert(testDrinks)
          .then(() => {
            return db.into("drinks").insert(testDrinks);
          });
      });

      it("responds with 200 and the specified article", () => {
        const drinkId = 2;
        const expectedDrink = testDrinks[drinkId - 1];
        return supertest(app)
          .get(`/api/drinks/${drinkId}`)
          .expect(200, expectedDrink);
      });
    });
  });

  describe(`POST /api/drinks`, () => {
    it(`creates a drink, responding with 201 and the new drink`, () => {
      const newDrink = {
        title: "Test new drink",
        alcohol: "vodka",
        instructions: "Test new article instructions...",
      };
      return supertest(app)
        .post("/api/drinks")
        .send(newDrink)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newDrink.title);
          expect(res.body.alcohol).to.eql(newDrink.alcohol);
          expect(res.body.instructions).to.eql(newDrink.instructions);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/drinks/${res.body.id}`);
        })
        .then((res) =>
          supertest(app).get(`/api/drinks/${res.body.id}`).expect(res.body)
        );
    });

    const requiredFields = ["title", "alcohol", "instructions"];

    requiredFields.forEach((field) => {
      const newDrink = {
        title: "Test new drink",
        alcohol: "vodka",
        instructions: "Test new article instructions...",
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newDrink[field];

        return supertest(app)
          .post("/api/drinks")
          .send(newDrink)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });
  });

  describe(`DELETE /api/drinks/:drink_id`, () => {
    context(`Given no drinks`, () => {
      it(`responds with 404`, () => {
        const drinkId = 123456;
        return supertest(app)
          .delete(`/api/drinks/${drinkId}`)
          .expect(404, { error: { message: `Drink Not Found` } });
      });
    });

    context("Given there are drinks in the database", () => {
      const testDrinks = makeDrinkArray();

      beforeEach("insert drinks", () => {
        return db
          .into("drinks")
          .insert(testDrinks)
          .then(() => {
            return db.into("drinks").insert(testDrinks);
          });
      });

      it("responds with 204 and removes the drink", () => {
        const idToRemove = 2;
        const expectedDrink = testDrinks.filter(
          (drink) => drink.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/drinks/${idToRemove}`)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/drinks`).expect(expectedDrink)
          );
      });
    });
  });

  describe(`PATCH /api/drinks/:drink_id`, () => {
    context(`Given no drinks`, () => {
      it(`responds with 404`, () => {
        const drinkId = 123456;
        return supertest(app)
          .delete(`/api/drinks/${drinkId}`)
          .expect(404, { error: { message: `Drink Not Found` } });
      });
    });

    context("Given there are drinks in the database", () => {
      const testDrinks = makeDrinkArray;

      beforeEach("insert drinks", () => {
        return db
          .into("drinks")
          .insert(testDrinks)
          .then(() => {
            return db.into("drinks").insert(testDrinks);
          });
      });

      it("responds with 204 and updates the drink", () => {
        const idToUpdate = 2;
        const updateDrink = {
          title: "updated drink title",
          alcohol: "rum",
          instructions: "updated article instructions",
        };
        const expectedDrink = {
          ...testDrinks[idToUpdate - 1],
          ...updateDrink,
        };
        return supertest(app)
          .patch(`/api/drinks/${idToUpdate}`)
          .send(updateDrink)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/drinks/${idToUpdate}`)
              .expect(expectedDrink)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/drinks/${idToUpdate}`)
          .send({ irrelevantField: "foo" })
          .expect(400, {
            error: {
              message: `Request body must contain either 'title', 'alcohol' or 'instructions'`,
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updateDrink = {
          title: "updated drink title",
        };
        const expectedDrink = {
          ...testDrinks[idToUpdate - 1],
          ...updateDrink,
        };

        return supertest(app)
          .patch(`/api/drinks/${idToUpdate}`)
          .send({
            ...updateDrink,
            fieldToIgnore: "should not be in GET response",
          })
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/drinks/${idToUpdate}`)
              .expect(expectedDrink)
          );
      });
    });
  });
});
