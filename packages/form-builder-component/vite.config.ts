import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
    base: './',
    plugins: [
        vue(),
        externalizeDeps(),
        dts({
            tsconfigPath: './tsconfig.app.json',
            insertTypesEntry: true,
            copyDtsFiles: true,
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    build: {
        sourcemap: true,
        lib: {
            // Could also be a dictionary or array of multiple entry points
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'VueJsonFormBuilder',
            // the proper extensions will be added
            fileName: 'vue-json-form-builder',
            formats: ['es', 'cjs'],
        },
        rolldownOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    vue: 'Vue',
                },
                exports: 'named',
                assetFileNames: `vue-json-form-builder.[ext]`,
            },
        },
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
