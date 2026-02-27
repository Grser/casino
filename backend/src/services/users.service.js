const crypto = require('crypto');
const pool = require('../db/pool');

function buildPasswordHash(password) {
  return `plain:${password}`;
}

function validatePassword(password, passwordHash) {
  return passwordHash === buildPasswordHash(password) || passwordHash === password;
}

async function listUsers() {
  const { rows } = await pool.query(
    `SELECT id, username, email, country_code, status, created_at
     FROM users
     ORDER BY created_at DESC;`
  );

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    countryCode: row.country_code,
    status: row.status,
    createdAt: row.created_at
  }));
}

async function authenticateUser({ usernameOrEmail, password }) {
  const { rows } = await pool.query(
    `SELECT id, username, email, country_code, password_hash
     FROM users
     WHERE username = $1 OR email = $1
     LIMIT 1;`,
    [usernameOrEmail]
  );

  if (rows.length === 0 || !validatePassword(password, rows[0].password_hash)) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const user = rows[0];
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    countryCode: user.country_code
  };
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
  createUserWithWallet,
  listUsers,
  authenticateUser
};
