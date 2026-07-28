import { PrototypeDatabase } from './database.js';
import { DEFAULT_DATABASE_FILE } from './runtime-path.js';

const database = new PrototypeDatabase(DEFAULT_DATABASE_FILE);
database.resetAndReseed();
database.close();
console.log('Lokalni prototip je očišćen i demo računi su ponovno postavljeni.');
