import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import pkg from './package.json';
import { externalizeDeps } from 'vite-plugin-externalize-deps';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';
import vueDevTools from 'vite-plugin-vue-devtools';

export default defineConfig({
    define: {
        'import.meta.env.PACKAGE_VERSION': JSON.stringify(pkg.version),
    },
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
        },
    },
    build: {
        sourcemap: true,
        minify: 'esbuild',
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'VueJsonForm',
            // the proper extensions will be added
            fileName: 'vue-json-form',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
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
        // nodePolyfills({
        //     include: ['path', 'util', 'process', 'buffer'],
        //     globals: {
        //         process: true,
        //         global: false,
        //         Buffer: true,
        //     },
        // }),
        // vueDevTools(),
        externalizeDeps(),
        vue({
            include: [/\.vue$/],
        }),
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.app.json',
            outDir: './dist',
            insertTypesEntry: true,
            copyDtsFiles: true,
        }),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
            },
        },
    },
});
