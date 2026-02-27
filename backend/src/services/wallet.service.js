const pool = require('../db/pool');

async function getWalletByUserId(userId) {
  const query = `
    SELECT w.id, w.user_id, w.currency, w.balance_cents, w.status, w.updated_at
    FROM wallets w
    WHERE w.user_id = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0] || null;
}

async function createWalletTransaction({ userId, amountCents, txType, description }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const walletResult = await client.query(
      `SELECT id, balance_cents
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE;`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new Error('WALLET_NOT_FOUND');
    }

    const wallet = walletResult.rows[0];
    let nextBalance = Number(wallet.balance_cents);

    if (txType === 'DEPOSIT') {
      nextBalance += amountCents;
    } else if (txType === 'WITHDRAW') {
      if (nextBalance < amountCents) {
        throw new Error('INSUFFICIENT_FUNDS');
      }
      nextBalance -= amountCents;
    } else {
      throw new Error('INVALID_TRANSACTION_TYPE');
    }

    await client.query(
      `UPDATE wallets
       SET balance_cents = $1, updated_at = NOW()
       WHERE id = $2;`,
      [nextBalance, wallet.id]
    );

    await client.query(
      `INSERT INTO wallet_transactions (wallet_id, tx_type, amount_cents, status, description)
       VALUES ($1, $2, $3, 'COMPLETED', $4);`,
      [wallet.id, txType, amountCents, description || null]
    );

    await client.query('COMMIT');
    return nextBalance;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getWalletByUserId,
  createWalletTransaction
};
