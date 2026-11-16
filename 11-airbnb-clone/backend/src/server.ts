import { app } from './app';

const PORT = process.env.PORT || 5011;

app.listen(PORT, () => {
  console.log(`Accommodation Marketplace Backend running on port ${PORT}`);
});
