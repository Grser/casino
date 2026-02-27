const express = require('express');
const { port } = require('./config/env');
const pool = require('./db/pool');
const healthRoutes = require('./routes/health.routes');
const gamesRoutes = require('./routes/games.routes');
const walletRoutes = require('./routes/wallet.routes');
const usersRoutes = require('./routes/users.routes');
const { errorHandler } = require('./middleware/error-handler');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(healthRoutes);
app.use(gamesRoutes);
app.use(walletRoutes);
app.use(usersRoutes);

app.use(errorHandler);

async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW() AS now;');
    console.log(`[DB] Conexión OK. Hora DB: ${result.rows[0].now.toISOString()}`);
  } catch (error) {
    console.error('[DB] Error conectando a PostgreSQL:', error.message);
  }
}

app.listen(port, () => {
  console.log(`Casino API running on port ${port}`);
  void checkDatabaseConnection();
});
