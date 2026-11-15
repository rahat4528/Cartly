import { createApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 4004;
const app = createApp();

app.listen(port, () => {
  console.log(`[04-hotel-booking-system-backend] Server listening on http://localhost:${port}`);
  console.log(`[04-hotel-booking-system-backend] API Base: http://localhost:${port}/api/v1`);
});
