import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: {
        'vue-json-forms-builder-schemas': './schemas/index.ts',
        // Separate entry so consumers that do not use realtime
        // collaboration never pay for the yjs bundle.
        collab: './schemas/collab/index.ts',
    },
    format: 'esm',
    outDir: 'dist',
    fixedExtension: false,
    sourcemap: true,
    dts: true,
});
