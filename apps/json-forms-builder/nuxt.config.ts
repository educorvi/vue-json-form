// https://nuxt.com/docs/api/configuration/nuxt-config
import { UVNexusPreset } from '@educorvi/uv-theme';

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: true,
    devtools: { enabled: true },

    css: ['~/assets/main.css', 'primeicons/primeicons.css'],

    postcss: {
        plugins: {
            '@tailwindcss/postcss': {},
        },
    },

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
        '@pinia/nuxt',
        '@nuxt/a11y',
        '@nuxt/eslint',
        '@nuxt/fonts',
        '@nuxt/hints',
        '@nuxt/icon',
        '@artmizu/nuxt-prometheus',
        '@nuxtjs/i18n',
        '@primevue/nuxt-module',
        '@nuxtjs/i18n',
    ],

    primevue: {
        options: {
            theme: {
                preset: UVNexusPreset,
                options: {
                    darkModeSelector: '.app-dark',
                },
            },
        },
    },

    i18n: {
        locales: [
            { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
            { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
        ],
        defaultLocale: 'en',
        lazy: true,
        // langDir: 'i18n/locales/',
        strategy: 'no_prefix',
    },

    nitro: {
        experimental: {
            openAPI: true,
        },
        typescript: {
            tsConfig: {
                compilerOptions: {
                    experimentalDecorators: true,
                    emitDecoratorMetadata: true,
                },
            },
        },
        openAPI: {
            meta: {
                title: 'Form Builder API',
                description: 'API for the vue_form_builder tool.',
                version: '1.0.0',
            },
        },
        esbuild: {
            options: {
                tsconfigRaw: {
                    compilerOptions: {
                        experimentalDecorators: true,
                        emitDecoratorMetadata: true,
                    },
                },
            },
        },
    },
});
