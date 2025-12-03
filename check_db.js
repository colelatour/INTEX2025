const knex = require('./db');

async function checkTables() {
  try {
    const tables = await knex('information_schema.tables')
      .select('table_name')
      .where('table_schema', 'public'); // Assuming public schema for user tables

    console.log('Tables in the database:');
    tables.forEach(table => {
      console.log(table.table_name);
    });
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    knex.destroy();
  }
}

checkTables();
