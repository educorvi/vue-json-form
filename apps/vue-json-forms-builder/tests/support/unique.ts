import { createHash, randomUUID } from 'node:crypto';

/** Short random suffix — unique per call (parallel-safe). */
export function randomSuffix(): string {
    return randomUUID().slice(0, 8);
}

/** Deterministic 8-char hash of a string (e.g. a test name) — stable
 * across retries, unique per distinct input. */
export function hashSuffix(value: string): string {
    return createHash('sha1').update(value).digest('hex').slice(0, 8);
}
