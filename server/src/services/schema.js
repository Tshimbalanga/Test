const PRIMARY_KEY_SQL = `
  SELECT k.COLUMN_NAME
  FROM information_schema.TABLE_CONSTRAINTS t
  JOIN information_schema.KEY_COLUMN_USAGE k
    ON k.CONSTRAINT_NAME = t.CONSTRAINT_NAME
   AND k.TABLE_SCHEMA = t.TABLE_SCHEMA
   AND k.TABLE_NAME = t.TABLE_NAME
  WHERE t.CONSTRAINT_TYPE = 'PRIMARY KEY'
    AND t.TABLE_SCHEMA = DATABASE()
    AND t.TABLE_NAME = ?
  ORDER BY k.ORDINAL_POSITION ASC
`;

const TABLE_COLUMNS_SQL = `
  SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ?
  ORDER BY ORDINAL_POSITION ASC
`;

async function getPrimaryKeyColumns(pool, tableName) {
  const [rows] = await pool.query(PRIMARY_KEY_SQL, [tableName]);
  return rows.map((r) => r.COLUMN_NAME);
}

async function getTableColumns(pool, tableName) {
  const [rows] = await pool.query(TABLE_COLUMNS_SQL, [tableName]);
  return rows.map((r) => ({
    name: r.COLUMN_NAME,
    dataType: r.DATA_TYPE,
    isNullable: r.IS_NULLABLE === 'YES',
    defaultValue: r.COLUMN_DEFAULT,
    isAutoIncrement: typeof r.EXTRA === 'string' && r.EXTRA.includes('auto_increment'),
  }));
}

module.exports = {
  getPrimaryKeyColumns,
  getTableColumns,
};

