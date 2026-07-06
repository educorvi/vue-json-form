import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
    base: './',
    plugins: [vue(), vueDevTools()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        sourcemap: true,
        lib: {
            entry: resolve(__dirname, 'src/main.ce.ts'),
            name: 'vue-json-form-builder',
            // the proper extensions will be added
            fileName: 'vue-json-form-builder',
            formats: ['umd', 'es'],
        },
        outDir: './dist',
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        // "process.env.NODE_ENV": JSON.stringify("development"),
    },
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
                silenceDeprecations: ['import'],
            },
        },
    },
});
