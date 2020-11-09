const path = require("path");
const express = require("express");
const xss = require("xss");
const DrinksService = require("./drinks-service");

const drinksRouter = express.Router();
const jsonParser = express.json();

const serializeDrink = (drink) => ({
  id: drink.id,
  title: xss(drink.title),
  alcohol: xss(drink.alcohol),
  mixers: xss(drink.mixers),
  liqueurs: xss(drink.liqueurs),
  juices: xss(drink.juices),
  other: xss(drink.other),
  instructions: xss(drink.instructions),
  modified: drink.modified,
});

drinksRouter
  .route("/")
  .get((req, res, next) => {
    DrinksService.getAllDrinks(req.app.get("db"))
      .then((drinks) => {
        res.json(drinks.map(serializeDrink));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const {
      title,
      alcohol,
      instructions,
      mixers,
      liqueurs,
      juices,
      other,
    } = req.body;
    const newDrink = {
      title,
      alcohol,
      instructions,
      mixers,
      liqueurs,
      juices,
      other,
    };

    for (const [key, value] of Object.entries(newDrink)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
    }

    DrinksService.insertDrink(req.app.get("db"), newDrink)
      .then((drink) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${drink.id}`))
          .json(serializeDrink(drink));
      })
      .catch(next);
  });

drinksRouter
  .route("/:drink_id")
  .all((req, res, next) => {
    const { drink_id } = req.params;
    DrinksService.getById(req.app.get("db"), drink_id)
      .then((drink) => {
        if (!drink) {
          return res.status(404).json({
            error: { message: `Drink Not Found` },
          });
        }
        res.drink = drink;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json({
      id: res.drink.id,
      modified: res.drink.modified,
      title: res.drink.title,
      alcohol: res.drink.alcohol,
      instructions: res.drink.instructions,
      mixers: res.drink.mixers,
      liqueurs: res.drink.mixers,
      juices: res.drink.juices,
      other: res.drink.other,
    });
  })
  .patch(jsonParser, (req, res, next) => {
    const {
      title,
      alcohol,
      instructions,
      mixers,
      liqueurs,
      juices,
      other,
      modified,
    } = req.body;
    const drinkToUpdate = {
      title,
      alcohol,
      instructions,
      mixers,
      liqueurs,
      juices,
      other,
      modified,
    };

    const numberOfValues = Object.values(drinkToUpdate).filter(Boolean).length;

    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain 'title',
          'alcohol',
          'instructions',
          'mixers',
          'liqueurs',
          'juices',
          'other',
          'modified'`,
        },
      });
    }

    DrinksService.updateDrink(
      req.app.get("db"),
      req.params.drink_id,
      drinkToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .delete((req, res, next) => {
    DrinksService.deleteDrink(req.app.get("db"), req.params.drink_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = drinksRouter;
