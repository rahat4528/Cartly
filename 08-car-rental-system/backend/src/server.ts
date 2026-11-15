import { createApp } from './app.js';

const PORT = process.env.PORT || 5008;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[08-car-rental-system] Server running on http://localhost:${PORT}`);
});
