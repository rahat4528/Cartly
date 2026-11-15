import { createApp } from './app.js';

const PORT = process.env.PORT || 5009;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[09-real-estate-listing-platform] Server running on http://localhost:${PORT}`);
});
