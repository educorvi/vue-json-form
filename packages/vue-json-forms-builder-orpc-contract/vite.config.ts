import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

export default defineConfig({
    build: {
        sourcemap: true,
        minify: false,
        lib: {
            entry: {
                index: './src/index.ts',
                contract: './src/contract.ts',
                'contract-with-errors': './src/contract-with-errors.ts',
                'generated/orpc.gen': './src/generated/orpc.gen.ts',
                'generated/zod.gen': './src/generated/zod.gen.ts',
            },
            formats: ['es'],
            // preserve the entry names (e.g. "generated/zod.gen.js")
            fileName: (_format, entryName) => `${entryName}.js`,
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
