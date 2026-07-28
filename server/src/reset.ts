import { PrototypeDatabase } from './database.js';
import { rmSync } from 'node:fs';
import { DEFAULT_DATABASE_FILE, DEFAULT_RECORDINGS_DIRECTORY } from './runtime-path.js';

const database = new PrototypeDatabase(DEFAULT_DATABASE_FILE);
database.resetAndReseed();
database.close();
rmSync(DEFAULT_RECORDINGS_DIRECTORY, { recursive: true, force: true });
console.log('Lokalni prototip je očišćen i demo računi su ponovno postavljeni.');
