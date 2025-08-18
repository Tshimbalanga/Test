const express = require('express');
const { getDbPool } = require('../services/db');
const { getPrimaryKeyColumns, getTableColumns } = require('../services/schema');
const { allowedTables, defaultPageSize, maxPageSize } = require('../config');

const router = express.Router({ mergeParams: true });

async function ensureTableAllowed(tableName) {
  if (!allowedTables || allowedTables.length === 0) {
    const error = new Error('No tables are allowed. Configure ALLOWED_TABLES in .env');
    error.status = 403;
    throw error;
  }
  if (!allowedTables.includes(tableName)) {
    const error = new Error(`Table not allowed: ${tableName}`);
    error.status = 403;
    throw error;
  }
}

function coerceLimitOffset(query) {
  const limit = Math.max(1, Math.min(parseInt(query.limit, 10) || defaultPageSize, maxPageSize));
  const offset = Math.max(0, parseInt(query.offset, 10) || 0);
  return { limit, offset };
}

router.get('/:table', async (req, res, next) => {
  const tableName = req.params.table;
  try {
    await ensureTableAllowed(tableName);
    const pool = getDbPool();
    const { limit, offset } = coerceLimitOffset(req.query);
    const pkColumns = await getPrimaryKeyColumns(pool, tableName);
    const orderBy = pkColumns.length === 1 ? pkColumns[0] : undefined;
    const sql = orderBy
      ? `SELECT * FROM \`${tableName}\` ORDER BY \`${orderBy}\` DESC LIMIT ? OFFSET ?`
      : `SELECT * FROM \`${tableName}\` LIMIT ? OFFSET ?`;
    const [rows] = await pool.query(sql, [limit, offset]);
    res.json({ data: rows, page: { limit, offset } });
  } catch (err) {
    next(err);
  }
});

router.get('/:table/:id', async (req, res, next) => {
  const tableName = req.params.table;
  const id = req.params.id;
  try {
    await ensureTableAllowed(tableName);
    const pool = getDbPool();
    const pkColumns = await getPrimaryKeyColumns(pool, tableName);
    if (pkColumns.length !== 1) {
      const error = new Error('Only single-column primary keys are supported for this endpoint');
      error.status = 400;
      throw error;
    }
    const pk = pkColumns[0];
    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\` WHERE \`${pk}\` = ? LIMIT 1`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not Found' });
    }
    return res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/:table', async (req, res, next) => {
  const tableName = req.params.table;
  const payload = req.body || {};
  try {
    await ensureTableAllowed(tableName);
    const pool = getDbPool();
    const columns = await getTableColumns(pool, tableName);
    const insertable = columns.filter((c) => !c.isAutoIncrement);
    const keys = insertable.map((c) => c.name).filter((name) => Object.prototype.hasOwnProperty.call(payload, name));
    if (keys.length === 0) {
      const error = new Error('No valid columns found in payload');
      error.status = 400;
      throw error;
    }
    const values = keys.map((k) => payload[k]);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO \`${tableName}\` (${keys.map((k) => `\`${k}\``).join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.query(sql, values);
    const pkColumns = await getPrimaryKeyColumns(pool, tableName);
    if (pkColumns.length === 1) {
      const pk = pkColumns[0];
      const idValue = result.insertId ?? payload[pk];
      if (idValue !== undefined) {
        const [rows] = await pool.query(`SELECT * FROM \`${tableName}\` WHERE \`${pk}\` = ? LIMIT 1`, [idValue]);
        return res.status(201).json(rows[0] || { id: idValue });
      }
    }
    return res.status(201).json({ affectedRows: result.affectedRows, insertId: result.insertId });
  } catch (err) {
    next(err);
  }
});

router.put('/:table/:id', async (req, res, next) => {
  const tableName = req.params.table;
  const id = req.params.id;
  const payload = req.body || {};
  try {
    await ensureTableAllowed(tableName);
    const pool = getDbPool();
    const pkColumns = await getPrimaryKeyColumns(pool, tableName);
    if (pkColumns.length !== 1) {
      const error = new Error('Only single-column primary keys are supported for this endpoint');
      error.status = 400;
      throw error;
    }
    const pk = pkColumns[0];
    const columns = await getTableColumns(pool, tableName);
    const updatable = columns.filter((c) => !c.isAutoIncrement).map((c) => c.name);
    const keys = updatable.filter((name) => Object.prototype.hasOwnProperty.call(payload, name));
    if (keys.length === 0) {
      const error = new Error('No valid columns to update');
      error.status = 400;
      throw error;
    }
    const setSql = keys.map((k) => `\`${k}\` = ?`).join(', ');
    const values = keys.map((k) => payload[k]);
    values.push(id);
    const sql = `UPDATE \`${tableName}\` SET ${setSql} WHERE \`${pk}\` = ?`;
    const [result] = await pool.query(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not Found' });
    }
    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\` WHERE \`${pk}\` = ? LIMIT 1`, [id]);
    return res.json(rows[0] || { updated: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:table/:id', async (req, res, next) => {
  const tableName = req.params.table;
  const id = req.params.id;
  try {
    await ensureTableAllowed(tableName);
    const pool = getDbPool();
    const pkColumns = await getPrimaryKeyColumns(pool, tableName);
    if (pkColumns.length !== 1) {
      const error = new Error('Only single-column primary keys are supported for this endpoint');
      error.status = 400;
      throw error;
    }
    const pk = pkColumns[0];
    const [result] = await pool.query(`DELETE FROM \`${tableName}\` WHERE \`${pk}\` = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not Found' });
    }
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;

