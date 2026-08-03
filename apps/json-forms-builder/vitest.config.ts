import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { defineVitestProject } from '@nuxt/test-utils/config';
import vue from '@vitejs/plugin-vue';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

const dotEnv = loadEnv(process.env.NODE_ENV ?? 'development', rootDir, '');
for (const [key, value] of Object.entries(dotEnv)) {
    if (process.env[key] === undefined) {
        process.env[key] = value;
    }
}

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'unit',
                    include: ['tests/unit/**/*.{test,spec}.ts'],
                    environment: 'node',
                },
            },
            {
                test: {
                    name: 'integration',
                    include: ['tests/integration/**/*.{test,spec}.ts'],
                    environment: 'node',
                    globalSetup: ['./tests/integration/setup/global-setup.ts'],
                    // testTimeout: 20_000,
                    // hookTimeout: 20_000,
                },
                // needed for TypeORM's legacy decorators (see nuxt.config.ts)
                oxc: false,
                esbuild: {
                    tsconfigRaw: {
                        compilerOptions: {
                            experimentalDecorators: true,
                            useDefineForClassFields: false,
                        },
                    },
                },
                resolve: {
                    alias: {
                        '~~': rootDir,
                        '@@': rootDir,
                    },
                },
            },
            {
                plugins: [vue()],
                test: {
                    name: 'component',
                    include: ['tests/component/**/*.{test,spec}.ts'],
                    environment: 'happy-dom',
                },
            },
            await defineVitestProject({
                test: {
                    name: 'nuxt',
                    include: ['tests/nuxt/**/*.{test,spec}.ts'],
                    environment: 'nuxt',
                },
            }),
        ],
    },
});
