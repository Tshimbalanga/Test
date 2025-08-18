const express = require('express');
const usersRouter = require('./users');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'B2B Monitor API' });
});

router.use('/users', usersRouter);

module.exports = { router };

