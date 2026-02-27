const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/health', async (req, res, next) => {
  try {
    const dbResult = await pool.query('SELECT NOW() AS now;');
    return res.json({
      status: 'ok',
      dbTime: dbResult.rows[0].now
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
