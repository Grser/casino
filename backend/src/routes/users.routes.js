const express = require('express');
const {
  createUserWithWallet,
  listUsers,
  authenticateUser
} = require('../services/users.service');

const router = express.Router();

router.get('/users', async (req, res, next) => {
  try {
    const users = await listUsers();
    return res.json(users);
  } catch (error) {
    return next(error);
  }
});

router.post('/users/login', async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS' });
    }

    const user = await authenticateUser({ usernameOrEmail, password });
    return res.json(user);
  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: error.message });
    }

    return next(error);
  }
});

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
