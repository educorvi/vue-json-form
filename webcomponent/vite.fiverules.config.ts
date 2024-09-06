import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) => tag.includes('vue-json-form'),
                },
            },
        }),
    ],
    build: {
        sourcemap: true,
        minify: 'terser',
        lib: {
            entry: './src/main.fiverules.ce.ts',
            name: 'vue-json-form',
            // the proper extensions will be added
            fileName: 'vue-json-form',
        },
        outDir: 'dist/fiverules',
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
});