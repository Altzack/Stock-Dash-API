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
        res.status(201).json(serializeStock(symbol));
      })
      .catch(next);
  });

watchlistRouter.route("/:symbol_id").delete((req, res, next) => {
  WatchlistService.deleteSymbol(req.app.get("db"), req.params.symbol_id)
    .then(() => {
      res.status(204).end();
    })
    .catch(next);
});

module.exports = watchlistRouter;
