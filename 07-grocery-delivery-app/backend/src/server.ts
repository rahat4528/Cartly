import { createApp } from './app.js';

const PORT = process.env.PORT || 5007;
const app = createApp();

app.listen(PORT, () => {
  console.log(`[07-grocery-delivery-app] Server running on http://localhost:${PORT}`);
});
