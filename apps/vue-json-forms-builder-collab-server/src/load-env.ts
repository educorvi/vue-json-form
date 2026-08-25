// Load the collab server's .env into process.env. Existing environment
// variables win (dotenv does not override by default).
import { config as loadEnv } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnv({
    path: resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env'),
});
