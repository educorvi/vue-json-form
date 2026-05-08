import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Icons from 'unplugin-icons/vite';

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    isCustomElement: (tag) =>
                        tag.includes('vue-json-form') ||
                        ['vjf-default', 'vjf-ajv', 'vjf-shadow'].includes(tag),
                },
            },
        }),
        Icons({
            compiler: 'vue3',
        }),
    ],
    define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
    },
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
                silenceDeprecations: ['import'],
            },
        },
    },
});
