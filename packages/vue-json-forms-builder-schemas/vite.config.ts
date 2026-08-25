import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
    build: {
        sourcemap: true,
        minify: false,
        lib: {
            entry: {
                'vue-json-forms-builder-schemas': './schemas/index.ts',
                // separate entry so consumers that do not use realtime
                // collaboration never pay for the yjs bundle
                collab: './schemas/collab/index.ts',
            },
            formats: ['es', 'cjs'],
            fileName: (format, entryName) =>
                `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
        },
        outDir: 'dist',
    },
    plugins: [
        dts({
            tsconfigPath: './tsconfig.json',
            outDir: './dist',
            insertTypesEntry: true,
            copyDtsFiles: true,
        }),
        externalizeDeps(),
    ],
});
