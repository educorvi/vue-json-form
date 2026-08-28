import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';

const alias = {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
};

export default defineConfig({
    test: {
        globals: true,
        projects: [
            {
                resolve: { alias },
                test: {
                    name: 'unit',
                    include: ['tests/unit/**/*.{test,spec}.ts'],
                    environment: 'node',
                },
            },
            {
                plugins: [vue()],
                resolve: { alias },
                test: {
                    name: 'component',
                    include: ['tests/component/**/*.{test,spec}.ts'],
                    environment: 'happy-dom',
                },
            },
        ],
    },
});
