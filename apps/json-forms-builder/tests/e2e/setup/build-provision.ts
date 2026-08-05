import { buildSync } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * WARNING: This is hacky!
 * Shared esbuild precompilation of the shared test-provisioning module (tests/support/provision.ts) to plain CJS at `.nuxt/e2e/provision.cjs`.
 *
 * WHY: the server's seed/provisioning modules use TypeORM entities, which rely on LEGACY (experimental) decorators. Playwright's own TS transform
 * emits standard (2023-05) decorators that TypeORM cannot run, and there is no way to swap Playwright's babel config (see
 * https://github.com/microsoft/playwright/issues/11440 — the maintainers recommend compiling the TS yourself). So the provisioning module — the
 * SAME one the integration tests import directly — is precompiled with esbuild here, same decorator config as vitest.config.ts's integration
 * project.
 *
 * `.nuxt/` is gitignored and the bundle is rebuilt on every run (by the global-setup AND the global-teardown), so the compiled artifact can
 * never go stale — and neither hook depends on the other having run.
 */
export const PROVISION_BUNDLE_PATH = fileURLToPath(
    new URL('../../../.nuxt/e2e/provision.cjs', import.meta.url)
);

export function buildProvisionBundle(): void {
    const rootDir = fileURLToPath(new URL('../../..', import.meta.url));
    mkdirSync(dirname(PROVISION_BUNDLE_PATH), { recursive: true });
    buildSync({
        entryPoints: [
            fileURLToPath(
                new URL('../../support/provision.ts', import.meta.url)
            ),
        ],
        outfile: PROVISION_BUNDLE_PATH,
        bundle: true,
        platform: 'node',
        format: 'cjs',
        // Keep node_modules external (resolved at runtime) — bundling
        // TypeORM pulls in optional driver imports (expo-sqlite etc.)
        // that aren't installed and fail the build.
        packages: 'external',
        tsconfigRaw: {
            compilerOptions: {
                experimentalDecorators: true,
                useDefineForClassFields: false,
            },
        },
        alias: { '~~': rootDir, '@@': rootDir },
        sourcemap: 'inline',
        logLevel: 'silent',
    });
}
