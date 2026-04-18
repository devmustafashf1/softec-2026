import { config } from './src/config/env.js';
import app from './src/app.js';

app.listen(config.port, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
});
