const express = require('express');
const usersRouter = require('./users');
const crudRouter = require('./crud');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'B2B Monitor API' });
});

router.use('/users', usersRouter);
router.use('/crud', crudRouter);

module.exports = { router };

