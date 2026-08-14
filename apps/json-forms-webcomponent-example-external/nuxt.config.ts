// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: true,
    devtools: { enabled: true },
    devServer: {
        port: 3001,
    },

    modules: [
        'nuxt-auth-utils',
        '@bootstrap-vue-next/nuxt',
        // Generates .nuxt/eslint.config.mjs with the auto-import globals
        // (composables, components, macros like definePageMeta) ESLint
        // otherwise flags as no-undef. See eslint.config.mjs, which merges
        // this with the repo's shared root config.
        '@nuxt/eslint',
    ],

    // bootstrap-vue-next components are auto-imported by the module, but the
    // CSS is not — without it every page renders as unstyled plain HTML.
    css: [
        'bootstrap/dist/css/bootstrap.min.css',
        'bootstrap-icons/font/bootstrap-icons.css',
        'bootstrap-vue-next/dist/bootstrap-vue-next.css',
    ],

    eslint: {
        config: {
            // The repo's root eslint.config.mjs already sets up JS/TS/Vue
            // recommended rules — only generate the Nuxt-specific parts
            // (auto-import globals etc.) here, not a second full preset.
            standalone: false,
        },
    },

    runtimeConfig: {
        // A distinct session cookie name is good practice when several
        // apps run on the same host. With different domains (this app on
        // external-example-app.localhost, the backend on localhost) the
        // cookies are already isolated by domain, but keeping the distinct
        // name avoids surprises. (Overridable via NUXT_SESSION_NAME.)
        session: {
            name: process.env.NUXT_SESSION_NAME ?? 'external-app-session',
        },
        public: {
            // Base URL of the backend the form-builder webcomponent
            // authenticates against (the main json-forms-builder app,
            // whose Keycloak brokers the external Keycloak).
            backendUrl: process.env.NUXT_PUBLIC_BACKEND_URL,
            // IdP alias in the backend's Keycloak realm (kc1) that redirects
            // to the external Keycloak via kc_idp_hint.
            keycloakIdpHint: process.env.NUXT_PUBLIC_KEYCLOAK_IDP_HINT,
            // Hocuspocus collab server of the backend (apps/json-forms-builder,
            // `yarn dev:collab`). The builder loads the form over this
            // websocket — document name = the form's numeric id.
            collabUrl: process.env.NUXT_PUBLIC_COLLAB_URL,
        },
    },

    vite: {
        vue: {
            template: {
                compilerOptions: {
                    // The form-builder webcomponent (defined by
                    // @educorvi/vue-json-forms-builder-webcomponent) is a
                    // native custom element, not a Vue component.
                    isCustomElement: (tag) => tag === 'vue-json-form-builder',
                },
            },
        },
    },
});
