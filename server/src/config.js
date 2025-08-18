function parseList(value) {
  return String(value || '')
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

module.exports = {
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  port: Number(process.env.PORT || 4000),
  allowedTables: parseList(process.env.ALLOWED_TABLES),
  defaultPageSize: Number(process.env.DEFAULT_PAGE_SIZE || 25),
  maxPageSize: Number(process.env.MAX_PAGE_SIZE || 100),
};

