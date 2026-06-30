// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: true,
    devtools: { enabled: true },

    modules: ['nuxt-auth-utils', '@bootstrap-vue-next/nuxt', '@nuxtjs/i18n'],

    // TypeORM uses legacy (experimental) decorators.
    // The standard TC39 decorator protocol passes `undefined` as the target
    // for field decorators, which breaks TypeORM's `object.constructor` access.
    nitro: {
        experimental: {
            openAPI: true,
        },
        esbuild: {
            options: {
                tsconfigRaw: {
                    compilerOptions: {
                        experimentalDecorators: true,
                        useDefineForClassFields: false,
                    },
                },
            },
        },
    },
    vite: {
        esbuild: {
            tsconfigRaw: {
                compilerOptions: {
                    experimentalDecorators: true,
                    useDefineForClassFields: false,
                },
            },
        },
    },

    css: ['bootstrap/dist/css/bootstrap.min.css'],

    i18n: {
        locales: [
            { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
            { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
        ],
        defaultLocale: 'en',
        lazy: true,
        strategy: 'no_prefix',
    },
});
