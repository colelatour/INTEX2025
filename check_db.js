// Import our database connection instance from the db module
// This gives us access to query the database using Knex.js
const knex = require('./db');

/**
 * Checks and displays all tables in the database's public schema
 * 
 * This function queries the information_schema (a special metadata database)
 * to retrieve a list of all user-created tables. It's useful for debugging
 * or verifying that migrations ran correctly.
 */
async function checkTables() {
  try {
    // Query the information_schema.tables view to get table metadata
    // This is a PostgreSQL system view that contains info about all tables
    const tables = await knex('information_schema.tables')
      .select('table_name')  // We only need the table names, not all the metadata
      .where('table_schema', 'public'); // Filter to just the 'public' schema where user tables typically live
                                        // (excludes system tables and other schemas)

    // Print a friendly header so the output is clear
    console.log('Tables in the database:');
    
    // Loop through each table object returned and print its name
    // The result is an array of objects like: [{ table_name: 'users' }, { table_name: 'posts' }, ...]
    tables.forEach(table => {
      console.log(table.table_name);
    });
    
  } catch (error) {
    // If something goes wrong (connection issues, permissions, etc.), log the error
    // This helps with debugging without crashing the entire application
    console.error('Error checking tables:', error);
    
  } finally {
    // IMPORTANT: Always destroy the Knex connection pool when done
    // This releases database connections and allows the Node.js process to exit cleanly
    // Without this, the script would hang indefinitely waiting for connections to close
    knex.destroy();
  }
}

// Execute the function immediately when this script runs
// This makes it a simple utility script you can run with: node check-tables.js
checkTables();