const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

module.exports = {
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || process.env.DB_PORT || 5432),
    database: process.env.DATABASE_NAME || process.env.DB_NAME || 'casino_db',
    user: process.env.DATABASE_USER || process.env.DB_USER || 'casino_user',
    password: process.env.DATABASE_PASS || process.env.DB_PASSWORD || 'casino_pass'
  }
};
