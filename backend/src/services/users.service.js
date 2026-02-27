const crypto = require('crypto');
const pool = require('../db/pool');

function buildPasswordHash(password) {
  return `plain:${password}`;
}

async function createUserWithWallet({ username, email, password, countryCode, currency = 'EUR' }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingUserResult = await client.query(
      `SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1;`,
      [username, email]
    );

    if (existingUserResult.rows.length > 0) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const userId = crypto.randomUUID();
    const walletId = crypto.randomUUID();

    await client.query(
      `INSERT INTO users (id, username, email, password_hash, country_code)
       VALUES ($1, $2, $3, $4, $5);`,
      [userId, username, email, buildPasswordHash(password), countryCode.toUpperCase()]
    );

    const walletResult = await client.query(
      `INSERT INTO wallets (id, user_id, currency, balance_cents)
       VALUES ($1, $2, $3, 0)
       RETURNING id, user_id, currency, balance_cents, status, updated_at;`,
      [walletId, userId, currency.toUpperCase()]
    );

    await client.query('COMMIT');

    const wallet = walletResult.rows[0];

    return {
      id: userId,
      username,
      email,
      countryCode: countryCode.toUpperCase(),
      wallet: {
        id: wallet.id,
        userId: wallet.user_id,
        currency: wallet.currency,
        balanceCents: Number(wallet.balance_cents),
        status: wallet.status,
        updatedAt: wallet.updated_at
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createUserWithWallet
};
