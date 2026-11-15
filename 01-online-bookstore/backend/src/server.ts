import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const PORT = process.env.PORT || 4001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[Online Bookstore API] Server running on http://localhost:${PORT}/api/v1`);
  console.log(`[Online Bookstore API] Healthcheck available at http://localhost:${PORT}/api/v1/health`);
});
