import { config } from './src/config/env.js';
import app from './src/app.js';
import { startStatusScheduler } from './src/jobs/statusScheduler.js';

app.listen(config.port, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
  startStatusScheduler();
});
