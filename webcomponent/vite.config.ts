import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag: any) => tag.includes('vue-json-form'),
                },
            },
        }),
    ],
    build: {
        sourcemap: true,
        minify: 'esbuild',
        lib: {
            entry: './src/main.ce.ts',
            name: 'vue-json-form',
            // the proper extensions will be added
            fileName: 'vue-json-form',
            formats: ['umd', 'es'],
        },
        outDir: 'dist',
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        // "process.env.NODE_ENV": JSON.stringify("development"),
    },
});
