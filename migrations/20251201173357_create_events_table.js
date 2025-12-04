/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('events', function(table) {
    table.increments('id').primary();
    table.string('eventname').notNullable();
    table.date('eventdate').notNullable();
    table.time('eventtimestart'); // New field
    table.time('eventtimeend');   // New field
    table.string('eventlocation'); // New field
    table.integer('eventcapacity'); // New field
    table.date('eventregistrationdeadline'); // New field
    table.text('description');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('events');
};
