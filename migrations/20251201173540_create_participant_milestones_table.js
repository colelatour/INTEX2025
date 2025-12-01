/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('participant_milestones', function(table) {
    table.increments('id').primary();
    table.integer('participant_id').unsigned().notNullable().references('id').inTable('participants');
    table.integer('milestone_id').unsigned().notNullable().references('id').inTable('milestones');
    table.date('completed_date');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('participant_milestones');
};
