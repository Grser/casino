const express = require('express');
const {
  getWalletByUserId,
  createWalletTransaction
} = require('../services/wallet.service');

const router = express.Router();

router.get('/wallet/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const wallet = await getWalletByUserId(userId);

    if (!wallet) {
      return res.status(404).json({ error: 'WALLET_NOT_FOUND' });
    }

    return res.json({
      id: wallet.id,
      userId: wallet.user_id,
      currency: wallet.currency,
      balanceCents: Number(wallet.balance_cents),
      status: wallet.status,
      updatedAt: wallet.updated_at
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/wallet/:userId/deposit', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const amountCents = Number(req.body.amountCents);

    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'INVALID_AMOUNT' });
    }

    const balanceCents = await createWalletTransaction({
      userId,
      amountCents,
      txType: 'DEPOSIT',
      description: 'Manual deposit'
    });

    return res.json({ userId, balanceCents });
  } catch (error) {
    if (error.message === 'WALLET_NOT_FOUND') {
      return res.status(404).json({ error: error.message });
    }
    return next(error);
  }
});

router.post('/wallet/:userId/withdraw', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const amountCents = Number(req.body.amountCents);

    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'INVALID_AMOUNT' });
    }

    const balanceCents = await createWalletTransaction({
      userId,
      amountCents,
      txType: 'WITHDRAW',
      description: 'Manual withdraw'
    });

    return res.json({ userId, balanceCents });
  } catch (error) {
    if (error.message === 'WALLET_NOT_FOUND' || error.message === 'INSUFFICIENT_FUNDS') {
      return res.status(400).json({ error: error.message });
    }

    return next(error);
  }
});

module.exports = router;
