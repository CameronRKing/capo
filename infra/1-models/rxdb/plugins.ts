import { addRxPlugin } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';

// Add dev mode plugin in development
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}
