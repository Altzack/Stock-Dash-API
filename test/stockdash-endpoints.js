const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const { makeSymbolArray } = require("./stockdash-fixtures");

describe("stockdash Endpoints", function () {
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
    db.raw("TRUNCATE watchlist RESTART IDENTITY CASCADE")
  );

  afterEach("cleanup", () =>
    db.raw("TRUNCATE watchlist RESTART IDENTITY CASCADE")
  );

  describe(`GET /api/watchlist`, () => {
    context(`Given no symbols`, () => {
      it(`responds with 200 and an empty list`, () => {
        return supertest(app).get("/api/watchlist").expect(200, []);
      });
    });

    context("Given there are symbols in the database", () => {
      const testSymbols = makeSymbolArray();

      beforeEach("insert symbol", () => {
        return db
          .into("watchlist")
          .insert(testSymbols)
          .then(() => {
            return db.into("watchlist").insert(testSymbols);
          });
      });

      it("responds with 200 and all of the symbols", () => {
        return supertest(app).get("/api/watchlist").expect(200, testSymbols);
      });
    });
  });

  describe(`POST /api/watchlist`, () => {
    it(`posts a symbol, responding with 201 and the new symbol`, () => {
      const newSymbol = {
        symbol: "FSLY",
      };
      return supertest(app)
        .post("/api/watchlist")
        .send(newSymbol)
        .expect(201)
        .expect((res) => {
          expect(res.body.symbol).to.eql(newSymbol.symbol);
          expect(res.body).to.have.property("id");
        });
    });

    const requiredFields = ["symbol"];

    requiredFields.forEach((field) => {
      const newSymbol = {
        symbol: "FSLY",
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newSymbol[field];

        return supertest(app)
          .post("/api/watchlist")
          .send(newSymbol)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });
  });

  describe(`DELETE /watchlist/:symbol_id`, () => {
    context(`Given no symbols`, () => {
      it(`responds with 404`, () => {
        const symbolId = 123456;
        return supertest(app)
          .delete(`/api/watchlist/${symbolId}`)
          .expect(404, { error: { message: `Symbol Not Found` } });
      });
    });

    context("Given there are symbols in the database", () => {
      const testSymbols = makeSymbolArray();

      beforeEach("insert symbols", () => {
        return db
          .into("watchlist")
          .insert(testSymbols)
          .then(() => {
            return db.into("watchlist").insert(testSymbols);
          });
      });

      it("responds with 204 and removes the symbol", () => {
        const idToRemove = 2;
        const expectedSymbol = testSymbols.filter(
          (symbol) => symbol.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/watchlist/${idToRemove}`)
          .expect(204)
          .then((res) =>
            supertest(app).get(`/api/watchlist`).expect(expectedSymbol)
          );
      });
    });
  });
});
