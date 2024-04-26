import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis',
            },
            // Enable esbuild polyfill plugins
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    buffer: true,
                }),
            ],
        },
    },
    build: {
        sourcemap: true,
        minify: true,
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'VueJsonForm',
            // the proper extensions will be added
            fileName: 'vue-json-form',
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            external: ['vue'],
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    vue: 'Vue',
                },
                exports: 'named',
                assetFileNames: `vue-json-form.[ext]`,
            },
        },
    },
    plugins: [
        vue({
            include: [/\.vue$/],
        }),
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.app.json',
            outDir: './dist',
        }),
    ],
});
