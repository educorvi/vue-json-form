import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export function getConfig(entry: string, outDir: string): Parameters<typeof defineConfig>[0] {
    return {
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
                entry,
                name: 'vue-json-form',
                // the proper extensions will be added
                fileName: 'vue-json-form',
                formats: ['umd', 'es'],
            },
            outDir,
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
            // "process.env.NODE_ENV": JSON.stringify("development"),
        },
    }
}

export default defineConfig(
    getConfig('./src/main.ce.ts', './dist/default')
);
