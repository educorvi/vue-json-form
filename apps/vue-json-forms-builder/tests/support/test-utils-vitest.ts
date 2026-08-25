import { expect } from 'vitest';
import { hashSuffix, randomSuffix } from './unique';

/**
 * Unique suffix derived from the CURRENT Vitest test name — deterministic (stable across retries) AND unique per test, so resources created by different tests never collide, regardless of run order or parallelism.
 *
 * NOTE: vitest-only — depends on `expect.getState().currentTestName` being set
 */
export function testSuffix(): string {
    const name = expect.getState().currentTestName;
    return name ? hashSuffix(name) : randomSuffix();
}
