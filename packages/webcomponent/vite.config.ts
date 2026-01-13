import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const buildTargets = {
    default: {
        entry: './src/main.ce.ts',
        outDir: './dist/default',
    },
    shadowDom: {
        entry: './src/mainWithShadowDOM.ce.ts',
        outDir: './dist/shadowDom',
    },
    ajvValidator: {
        entry: './src/mainWithAjvValidator.ce.ts',
        outDir: './dist/ajvValidator',
    },
};

const target = process.env.BUILD_TARGET || 'default';
const config = buildTargets[target as keyof typeof buildTargets];

if (!config) {
    throw new Error(`Unknown build target: ${target}. Available targets: ${Object.keys(buildTargets).join(', ')}`);
}

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
            entry: config.entry,
            name: 'vue-json-form',
            // the proper extensions will be added
            fileName: 'vue-json-form',
            formats: ['umd', 'es'],
        },
        outDir: config.outDir,
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        // "process.env.NODE_ENV": JSON.stringify("development"),
    },
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
            },
        },
    },
});
