import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { analyzer } from 'vite-bundle-analyzer';

export default defineConfig({
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
