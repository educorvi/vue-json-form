import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
    build: {
        sourcemap: true,
        minify: 'esbuild',
        lib: {
            entry: './src/index.ts',
            name: 'vue-json-form-schemas',
            // the proper extensions will be added
            fileName: 'vue-json-form-schemas',
            formats: ['es', 'cjs'],
        },
        outDir: 'dist',
    },
    plugins: [
        dts({
            rollupTypes: true,
            tsconfigPath: './tsconfig.json',
            outDir: './dist',
            insertTypesEntry: true,
            copyDtsFiles: true,
        }),
        viteStaticCopy({
            targets: [
                { src: 'src/generated/ui-merged.schema.json', dest: '.', rename: 'ui.schema.json' },
                { src: 'src/generated/json-merged.schema.json', dest: '.', rename: 'json-2019.schema.json' }
            ],
        }),
        externalizeDeps()
    ],
});
