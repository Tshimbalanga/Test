/* eslint-disable no-console */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { router: apiRouter } = require('./routes');

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'b2b-monitor-backend', timestamp: new Date().toISOString() });
});

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-unused-vars
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT} (CORS origin: ${FRONTEND_ORIGIN})`);
});

