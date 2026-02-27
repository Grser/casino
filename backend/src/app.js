const express = require('express');
const { port } = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const gamesRoutes = require('./routes/games.routes');
const walletRoutes = require('./routes/wallet.routes');
const { errorHandler } = require('./middleware/error-handler');

const app = express();

app.use(express.json());

app.use(healthRoutes);
app.use(gamesRoutes);
app.use(walletRoutes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Casino API running on port ${port}`);
});
