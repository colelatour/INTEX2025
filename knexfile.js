// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host: process.env.RDS_HOSTNAME || 'localhost',
      user: process.env.RDS_USERNAME || 'postgres',
      password: process.env.RDS_PASSWORD || 'clatour0',
      database: process.env.RDS_DB_NAME || 'ellarises',
      port: process.env.RDS_PORT || 5432,
      ssl: process.env.RDS_HOSTNAME ? { rejectUnauthorized: false } : false
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'ellarises',
      user:     'postgres',
      password: 'clatour0'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

production: {
    client: 'postgresql',
    connection: {
      host: process.env.RDS_HOSTNAME,
      user: process.env.RDS_USERNAME,
      password: process.env.RDS_PASSWORD,
      database: process.env.RDS_DB_NAME,
      port: process.env.RDS_PORT || 5432
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
