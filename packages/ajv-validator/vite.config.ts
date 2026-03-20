import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
        extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.cjs'],
    },
    build: {
        sourcemap: true,
        minify: 'esbuild',
        lib: {
            entry: './src/index.ts',
            name: 'vue-json-form-ajv-validator',
            // the proper extensions will be added
            fileName: 'vue-json-form-ajv-validator',
            formats: ['es', 'cjs'],
        },
        outDir: 'dist',
        commonjsOptions: { transformMixedEsModules: true },
    },
    plugins: [
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.json',
            outDir: './dist',
            insertTypesEntry: true,
            copyDtsFiles: true,
        }),
        // analyzer()
    ],
});
