const express = require('express');
const { createUserWithWallet } = require('../services/users.service');

const router = express.Router();

router.post('/users', async (req, res, next) => {
  try {
    const { username, email, password, countryCode, currency } = req.body;

    if (!username || !email || !password || !countryCode) {
      return res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    }

    const createdUser = await createUserWithWallet({
      username,
      email,
      password,
      countryCode,
      currency
    });

    return res.status(201).json(createdUser);
  } catch (error) {
    if (error.message === 'USER_ALREADY_EXISTS') {
      return res.status(409).json({ error: error.message });
    }

    return next(error);
  }
});

module.exports = router;
