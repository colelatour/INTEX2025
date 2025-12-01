/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('surveys', function(table) {
    table.increments('id').primary();
    table.integer('participant_id').unsigned().notNullable().references('id').inTable('participants');
    table.string('title').notNullable();
    table.text('description');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('surveys');
};
