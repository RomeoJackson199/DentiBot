'use strict';

const { createApp } = require('./authMagicRoutes');

const app = createApp();
const port = parseInt(process.env.PORT || '3000', 10);

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Magic auth server listening on http://localhost:${port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

