import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import {viteStaticCopy} from 'vite-plugin-static-copy';

export default defineConfig({
    build: {
        sourcemap: true,
        minify: 'esbuild',
        lib: {
            entry: './src/index.ts',
            name: 'vue-json-form-schemas',
            // the proper extensions will be added
            fileName: 'vue-json-form-schemas',
            formats: ['umd', 'es'],
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
                { src: 'src/json-schema_draft7.json', dest: '.' },
            ],
        }),
    ],
});
