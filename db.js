const knex = require('knex')({
  client: 'postgresql',
  connection: {
    host: process.env.RDS_HOSTNAME || 'localhost',
    user: process.env.RDS_USERNAME || 'postgres',
    password: process.env.RDS_PASSWORD || 'clatour0',
    database: process.env.RDS_DB_NAME || 'ellarises',
    port: process.env.RDS_PORT || 5432,
    ssl: { rejectUnauthorized: false }
  },
  pool: {
    min: 2,
    max: 10
  }
});

module.exports = knex;
