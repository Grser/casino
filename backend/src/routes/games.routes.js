const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/games', async (req, res, next) => {
  try {
    const query = `
      SELECT g.id, g.code, g.name, g.type, g.status,
             gv.id AS variant_id,
             gv.name AS variant_name,
             gv.min_bet_cents,
             gv.max_bet_cents,
             gv.house_edge_percent
      FROM games g
      LEFT JOIN game_variants gv ON gv.game_id = g.id AND gv.status = 'ACTIVE'
      WHERE g.status = 'ACTIVE'
      ORDER BY g.name, gv.name;
    `;

    const { rows } = await pool.query(query);

    const grouped = rows.reduce((acc, row) => {
      const game = acc[row.id] || {
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type,
        status: row.status,
        variants: []
      };

      if (row.variant_id) {
        game.variants.push({
          id: row.variant_id,
          name: row.variant_name,
          minBetCents: Number(row.min_bet_cents),
          maxBetCents: Number(row.max_bet_cents),
          houseEdgePercent: Number(row.house_edge_percent)
        });
      }

      acc[row.id] = game;
      return acc;
    }, {});

    return res.json(Object.values(grouped));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
