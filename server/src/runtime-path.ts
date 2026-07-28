import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_DATABASE_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'runtime',
  'artikulino.sqlite',
);
