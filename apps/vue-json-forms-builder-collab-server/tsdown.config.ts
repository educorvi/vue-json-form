import { defineConfig } from 'tsdown';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
    entry: 'src/index.ts',
    format: ['esm'],
    outDir: 'dist',
    sourcemap: true,
    dts: false,
});
