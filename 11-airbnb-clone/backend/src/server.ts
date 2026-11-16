import { createApp } from './app.js';

const PORT = process.env.PORT || 5011;
const app = createApp();

app.listen(PORT, () => {
  console.log(`🏖️ Cartly Accommodation Marketplace (Airbnb Clone) Backend running on port ${PORT}`);
});
