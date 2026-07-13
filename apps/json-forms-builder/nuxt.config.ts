// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: true,
    devtools: { enabled: true },

    modules: [
        '@pinia/nuxt',
        'nuxt-auth-utils',
        '@bootstrap-vue-next/nuxt',
        '@nuxtjs/i18n',
        'nuxt-phosphor-icons',
    ],

    // The form-builder is a complex client-side component using localStorage,
    // custom Pinia stores with persisted state, and heavy browser APIs.
    // Render it entirely on the client (SPA mode for these routes).
    routeRules: {
        '/form-builder': { ssr: false },
        '/form-builder/**': { ssr: false },
        '/forms/detail': { ssr: false },
    },

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
        alias: {
            // @educorvi/rita imports dayjs plugins without .js extension,
            // which fails in ESM resolution (Node.js requires explicit .js).
            'dayjs/plugin/duration': 'dayjs/plugin/duration.js',
            'dayjs/plugin/relativeTime': 'dayjs/plugin/relativeTime.js',
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
        resolve: {
            alias: {
                // @educorvi/rita imports dayjs plugins without .js extension,
                // which fails in ESM resolution (Node.js requires explicit .js).
                'dayjs/plugin/duration': 'dayjs/plugin/duration.js',
                'dayjs/plugin/relativeTime': 'dayjs/plugin/relativeTime.js',
            },
        },
        // Pre-bundle these dependencies at dev-server startup so the heavy
        // Vite dependency optimization happens once, not incrementally across
        // multiple page reloads (each blocking 20–60 seconds).
        optimizeDeps: {
            include: [
                '@orpc/client',
                '@orpc/client/fetch',
                '@phosphor-icons/vue',
                '@vue/devtools-core',
                '@vue/devtools-kit',
                '@vueuse/core',
                'bootstrap-vue-next',
                'decimal.js',
                'deepmerge',
                'fast-deep-equal',
                'json-pointer',
                'pinia',
                'pinia-plugin-persistedstate',
                'sanitize-html',
                'uuid',
                'vue-draggable-plus',
            ],
        },
        ssr: {
            // Workspace packages ship raw .vue SFCs and TypeScript source —
            // Vite must bundle (not externalize) them for SSR to process
            // their imports and SFC compilation correctly.
            noExternal: [
                '@educorvi/vue-json-form-builder',
                '@educorvi/vue-json-form',
                '@educorvi/rita',
                // 'pinia',
                '@vueuse/core',
                'vue-draggable-plus',
            ],
        },
    },

    css: [
        'bootstrap/dist/css/bootstrap.min.css',
        'bootstrap-icons/font/bootstrap-icons.css',
    ],

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
