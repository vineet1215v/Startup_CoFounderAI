const { drizzle } = require('drizzle-orm/node-postgres')
const { Pool } = require('pg')

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/cofounder_ai'

const pool = new Pool({ connectionString: databaseUrl })

const db = drizzle(pool)

module.exports = { db, pool }
