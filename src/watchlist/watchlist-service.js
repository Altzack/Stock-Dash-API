const WatchlistService = {
  getWatchlist(knex) {
    return knex.select("*").from("watchlist");
  },
  insertStock(knex, newStock) {
    return knex
      .insert(newStock)
      .into("watchlist")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
  getById(knex, id) {
    return knex.from("watchlist").select("*").where("id", id).first();
  },
  deleteDrink(knex, id) {
    return knex("watchlist").where({ id }).delete();
  },
  updateDrink(knex, id, newStockFields) {
    return knex("watchlist").where({ id }).update(newStockFields);
  },
};

module.exports = WatchlistService;
