/**
 * Minimal .env loader for the standalone collab server.
 *
 * Nuxt loads .env automatically, but this process runs plain tsx, so we read
 * the app's .env file here (without overriding already-set env vars).
 * Import this module FIRST, before anything that reads process.env.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env');

if (existsSync(envPath)) {
    for (const rawLine of readFileSync(envPath, 'utf8').split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq <= 0) continue;
        const key = line.slice(0, eq).trim();
        let value = line.slice(eq + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        // Inline comments (value # comment)
        const hash = value.indexOf(' #');
        if (hash > 0) value = value.slice(0, hash).trim();
        if (process.env[key] === undefined) process.env[key] = value;
    }
}
