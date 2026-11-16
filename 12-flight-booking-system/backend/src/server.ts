import { createApp } from './app.js';

const PORT = process.env.PORT || 5012;
const app = createApp();

app.listen(PORT, () => {
  console.log(`✈️ Cartly Flight Booking System (Demonstration Inventory) running on port ${PORT}`);
});
