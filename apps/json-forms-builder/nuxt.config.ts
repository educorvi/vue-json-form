// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path';

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: true,
    devtools: { enabled: true },

    modules: [
        '@pinia/nuxt',
        'nuxt-auth-utils',
        '@bootstrap-vue-next/nuxt',
        '@nuxtjs/i18n',
        '@nuxt/icon',
        // Adds a Vitest panel to Nuxt DevTools.
        '@nuxt/test-utils/module',
        // Generates .nuxt/eslint.config.mjs with the auto-import globals
        // (composables, components, macros like definePageMeta) ESLint
        // otherwise flags as no-undef. See eslint.config.mjs, which merges
        // this with the repo's shared root config.
        '@nuxt/eslint',
    ],

    icon: {
        serverBundle: {
            collections: ['ph'],
        },
        clientBundle: {
            scan: true,
        },
    },

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

    // Realtime collaboration (Hocuspocus) — the builder connects to this
    // WebSocket URL when the `collab` prop is set (see app/pages/forms/detail.vue).
    // Off by default; set NUXT_PUBLIC_COLLAB_URL to enable.
    runtimeConfig: {
        public: {
            collabUrl: process.env.NUXT_PUBLIC_COLLAB_URL ?? '',
        },
        // Comma-separated origins allowed as `?redirect=` target on
        // /auth/keycloak (see server/routes/auth/keycloak.get.ts). Used by
        // external apps embedding the form-builder webcomponent.
        auth: {
            allowedRedirectOrigins:
                process.env.NUXT_AUTH_ALLOWED_REDIRECT_ORIGINS ?? '',
            // Comma-separated Keycloak client ids whose ACCESS TOKENS are
            // accepted for bearer auth (azp/aud check in
            // server/lib/jwt-auth.ts). Needed for the PUBLIC embed client
            // ("vueformbuilder-embed") that the form-builder webcomponent
            // logs in with (keycloak-js). Empty = only the OIDC client
            // (NUXT_OAUTH_KEYCLOAK_CLIENT_ID) is accepted.
            allowedClientIds: process.env.NUXT_AUTH_ALLOWED_CLIENT_IDS ?? '',
        },
        // The session cookie: SameSite=None + Secure lets browsers WITHOUT
        // third-party-cookie blocking (e.g. the VS Code embedded browser)
        // attach the cookie to the cross-site session check and the collab
        // websocket handshake. This is an OPTIMIZATION only — browsers WITH
        // third-party-cookie blocking ignore the cookie regardless; there
        // the webcomponent uses keycloak-js (silent check-sso + bearer
        // token, see useBuilderAuth) instead of relying on the cookie.
        // session: {
        //     cookie: {
        //         sameSite: 'none',
        //         secure: true,
        //     },
        // },
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
                // '@educorvi/vue-json-form-builder': resolve(
                //     __dirname,
                //     '../../packages/vue-json-form-builder/src/main.ts'
                // ),
                // '@educorvi/vue-json-form-builder-schemas': resolve(
                //     __dirname,
                //     '../../packages/vue-json-form-builder-schemas/schemas/index.ts'
                // ),
                // '@educorvi/vue-json-form-builder-schemas/collab': resolve(
                //     __dirname,
                //     '../../packages/vue-json-form-builder-schemas/schemas/collab/index.ts'
                // ),
            },
        },
        // Pre-bundle these dependencies at dev-server startup so the heavy
        // Vite dependency optimization happens once, not incrementally across
        // multiple page reloads (each blocking 20–60 seconds).
        optimizeDeps: {
            // exclude: [
            //     '@educorvi/vue-json-form-builder',
            //     '@educorvi/vue-json-form-builder-schemas',
            // ],
            include: [
                '@orpc/client',
                '@orpc/client/fetch',
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
        // Extracted component styles of the builder library (scoped SFC
        // styles are NOT imported by its dist JS — consumers must load the
        // CSS file themselves). Without this, e.g. the avatar stack's
        // overlap margin reset is missing.
        '@educorvi/vue-json-form-builder/dist/vue-json-form-builder.css',
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
