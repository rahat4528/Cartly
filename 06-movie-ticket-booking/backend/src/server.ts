import { createApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 4006;
const app = createApp();

app.listen(port, () => {
  console.log(`[06-movie-ticket-booking-backend] Server listening on http://localhost:${port}`);
  console.log(`[06-movie-ticket-booking-backend] API Base: http://localhost:${port}/api/v1`);
});
