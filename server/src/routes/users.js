const express = require('express');
const router = express.Router();
const { getDbPool } = require('../services/db');

router.get('/', async (req, res, next) => {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT 1 as ok');
    res.json({ users: [], db: rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

