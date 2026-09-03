import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: {
        index: './src/index.ts',
        contract: './src/contract.ts',
        'contract-with-errors': './src/contract-with-errors.ts',
        'generated/orpc.gen': './src/generated/orpc.gen.ts',
        'generated/zod.gen': './src/generated/zod.gen.ts',
    },
    format: 'esm',
    outDir: 'dist',
    fixedExtension: false,
    sourcemap: true,
    dts: true,
});
