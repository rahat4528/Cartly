import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';

const PORT = process.env.PORT || 4003;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[Job Board API] Server running on http://localhost:${PORT}/api/v1`);
  console.log(`[Job Board API] Healthcheck available at http://localhost:${PORT}/api/v1/health`);
});
