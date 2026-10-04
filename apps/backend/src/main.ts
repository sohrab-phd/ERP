import { loadConfig } from './config.js';
import { compose } from './composition-root.js';
const app = compose(loadConfig(process.env));
await app.start();
let stopping = false;
const stop = () => {
  if (stopping) return;
  stopping = true;
  const timer = setTimeout(() => {
    process.exitCode = 1;
    app.server.closeAllConnections();
  }, 10000);
  timer.unref();
  void app.stop().then(
    () => {
      clearTimeout(timer);
    },
    () => {
      clearTimeout(timer);
      process.exitCode = 1;
    },
  );
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
