const fs = require('fs/promises');
const path = require('path');
const pool = require('./pool');

async function readSqlFile(fileName) {
  const filePath = path.resolve(__dirname, '../../../database', fileName);
  return fs.readFile(filePath, 'utf8');
}

async function bootstrapDatabase() {
  const client = await pool.connect();

  try {
    const schemaSql = await readSqlFile('schema.sql');
    const seedSql = await readSqlFile('seed.sql');

    await client.query('BEGIN');
    await client.query(schemaSql);
    await client.query(seedSql);
    await client.query('COMMIT');

    console.log('Base de datos SQL inicializada correctamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inicializando la base de datos SQL:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

bootstrapDatabase();
