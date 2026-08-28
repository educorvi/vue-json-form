import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['test/unit/**/*.{test,spec}.ts'],

        env: {
            COLLAB_ALLOWED_ORIGINS: 'http://localhost:3000',
        },
    },
});
