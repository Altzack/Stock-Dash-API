const path = require("path");
const express = require("express");
const xss = require("xss");
const WatchlistService = require("./watchlist-service");

const watchlistRouter = express.Router();
const jsonParser = express.json();

const serializeStock = (stock) => ({
  id: stock.id,
  symbol: xss(stock.symbol),
});

watchlistRouter
  .route("/")
  .get((req, res, next) => {
    WatchlistService.getWatchlist(req.app.get("db"))
      .then((watchlist) => {
        res.json(watchlist);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { symbol } = req.body;
    const newSymbol = {
      symbol,
    };

    for (const [key, value] of Object.entries(newSymbol)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
    }

    WatchlistService.insertSymbol(req.app.get("db"), newSymbol)
      .then((symbol) => {
        res.status(201);
        json(serializeStock(symbol));
      })
      .catch(next);
  });

watchlistRouter
  .route("/:symbol_id")
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
    WatchlistService.deleteSymbol(req.app.get("db"), req.params.symbol_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = watchlistRouter;
