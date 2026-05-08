// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura';

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: false,
    devtools: { enabled: true },

    typescript: {
        tsConfig: {
            compilerOptions: {
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
            },
        },
    },

    modules: [
        '@nuxt/a11y',
        '@nuxt/eslint',
        '@nuxt/fonts',
        '@nuxt/hints',
        '@nuxt/icon',
        '@artmizu/nuxt-prometheus',
        '@nuxtjs/i18n',
        '@primevue/nuxt-module',
    ],

    primevue: {
        options: {
            theme: {
                preset: Aura,
            },
        },
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
