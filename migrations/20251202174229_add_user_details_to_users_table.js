/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.string('firstName').notNullable().defaultTo(''); // Add firstName column
    table.string('lastName').notNullable().defaultTo('');  // Add lastName column
    table.string('email').unique().notNullable().defaultTo(''); // Add unique email column
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('firstName');
    table.dropColumn('lastName');
    table.dropColumn('email');
  });
};
