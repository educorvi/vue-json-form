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
        // Adds a Vitest panel to Nuxt DevTools.
        '@nuxt/test-utils/module',
        // Generates .nuxt/eslint.config.mjs with the auto-import globals
        // (composables, components, macros like definePageMeta) ESLint
        // otherwise flags as no-undef. See eslint.config.mjs, which merges
        // this with the repo's shared root config.
        '@nuxt/eslint',
    ],

    eslint: {
        config: {
            // The repo's root eslint.config.mjs already sets up JS/TS/Vue
            // recommended rules — only generate the Nuxt-specific parts
            // (auto-import globals etc.) here, not a second full preset.
            standalone: false,
        },
    },

    // `tests/nuxt/**` is included in the app TS context automatically by
    // @nuxt/test-utils. These two also need Nuxt path aliases (`~~/`) and
    // types for editor support even though they run in a plain Node
    // environment (see vitest.config.ts).
    typescript: {
        tsConfig: {
            include: ['../tests/unit/**/*', '../tests/integration/**/*'],
        },
    },

    // The form-builder is a complex client-side component using localStorage,
    // custom Pinia stores with persisted state.
    // Render it entirely on the client (SPA mode for these routes).
    routeRules: {
        '/forms/detail': { ssr: false },
    },

    // TypeORM uses legacy (experimental) decorators.
    hooks: {
        'prepare:types'(opts: any) {
            // opts.tsConfig.compilerOptions.experimentalDecorators = true;
            // opts.tsConfig.compilerOptions.useDefineForClassFields = false;
            // opts.nodeTsConfig.compilerOptions.experimentalDecorators = true;
            // opts.nodeTsConfig.compilerOptions.useDefineForClassFields = false;
            // opts.sharedTsConfig.compilerOptions.experimentalDecorators = true;
            // opts.sharedTsConfig.compilerOptions.useDefineForClassFields = false;
        },
        'nitro:config'(nitroConfig: any) {
            nitroConfig.typescript.tsConfig.compilerOptions.experimentalDecorators = true;
            nitroConfig.typescript.tsConfig.compilerOptions.useDefineForClassFields = false;
        },
    },
    nitro: {
        // experimental: {
        //     openAPI: true,
        // },
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
