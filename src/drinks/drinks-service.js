const DrinksService = {
  getAllDrinks(knex) {
    return knex.select("*").from("drinks");
  },
  insertDrink(knex, newDrink) {
    return knex
      .insert(newDrink)
      .into("drinks")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
  getById(knex, id) {
    return knex.from("drinks").select("*").where("id", id).first();
  },
  deleteDrink(knex, id) {
    return knex("drinks").where({ id }).delete();
  },
  updateDrink(knex, id, newDrinkFields) {
    return knex("drinks").where({ id }).update(newDrinkFields);
  },
};

module.exports = DrinksService;
