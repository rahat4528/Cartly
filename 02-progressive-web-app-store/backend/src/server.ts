import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const PORT = process.env.PORT || 4002;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[PWA Store API] Server running on http://localhost:${PORT}/api/v1`);
  console.log(`[PWA Store API] Healthcheck available at http://localhost:${PORT}/api/v1/health`);
});
