/* eslint-disable no-console */
const mysql = require('mysql2/promise');

let pool;

function createPool() {
  const {
    DB_HOST = 'localhost',
    DB_PORT = '3306',
    DB_USER = 'root',
    DB_PASSWORD = '',
    DB_NAME = 'b2b_monitor',
    DB_CONN_LIMIT = '10',
  } = process.env;

  pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(DB_CONN_LIMIT),
    queueLimit: 0,
    dateStrings: true,
  });

  pool.on('connection', () => {
    console.log('MySQL pool acquired a new connection');
  });

  return pool;
}

function getDbPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

module.exports = { getDbPool };

