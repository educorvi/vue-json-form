import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
    build: {
        sourcemap: true,
        // Library output: keep identifiers intact. Minified single-letter
        // names (e.g. `h`, `g`) in shared chunks collide with other chunks
        // when consumers (Nuxt/Vite) merge them — "Identifier 'h' has
        // already been declared" during app builds.
        minify: false,
        lib: {
            entry: {
                'vue-json-form-builder-schemas': './schemas/index.ts',
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
