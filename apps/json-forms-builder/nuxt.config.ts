// https://nuxt.com/docs/api/configuration/nuxt-config
import path from 'path';
import { fileURLToPath } from 'url';

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: true,
    devtools: { enabled: true },

    app: {
        head: {
            htmlAttrs: { lang: 'en' },
            title: 'Form Builder',
        },
    },

    css: ['~/assets/main.scss'],

    typescript: {
        tsConfig: {
            compilerOptions: {
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
            },
        },
    },

    modules: [
        'nuxt-auth-utils',
        '@nuxt/a11y',
        '@nuxt/eslint',
        '@nuxt/fonts',
        '@nuxt/hints',
        '@nuxt/icon',
        // '@artmizu/nuxt-prometheus',
        '@nuxtjs/i18n',
    ],

    i18n: {
        locales: [
            { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
            { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
        ],
        defaultLocale: 'en',
        // lazy: true,
        strategy: 'no_prefix',
    },

    nitro: {
        typescript: {
            tsConfig: {
                compilerOptions: {
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true,
                },
            },
        },
        esbuild: {
            options: {
                tsconfigRaw: {
                    compilerOptions: {
                        experimentalDecorators: true,
                        // @ts-expect-error debugging
                        emitDecoratorMetadata: true,
                    },
                },
            },
        },
    },

    vite: {
        optimizeDeps: {
            include: [
                '@orpc/client',
                '@orpc/client/fetch',
                '@phosphor-icons/vue',
                '@vue/devtools-core',
                '@vue/devtools-kit',
                'bootstrap-vue-next',
                'pinia',
            ],
        },
    },
});
