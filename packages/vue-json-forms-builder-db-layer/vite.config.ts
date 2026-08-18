import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: './src/index.ts',
            name: 'json-form-build-db-layer',
            // the proper extensions will be added
            fileName: 'json-form-build-db-layer',
            formats: ['es', 'cjs'],
        },
        outDir: 'dist',
    },
    plugins: [
        dts({
            tsconfigPath: './tsconfig.json',
            outDirs: './dist',
            insertTypesEntry: true,
            copyDtsFiles: true,
        }),
        externalizeDeps(),
    ],
});
