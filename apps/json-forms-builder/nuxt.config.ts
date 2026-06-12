// https://nuxt.com/docs/api/configuration/nuxt-config
import { UVNexusPreset } from '@educorvi/dguv-theme';
import Aura from '@primeuix/themes/aura';
import path from 'path';
import { fileURLToPath } from 'url';

// TODO: hacky workaround
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const vueFormBuilderSrc = path.resolve(
    __dirname,
    '../../packages/vue-form-builder/src'
);

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

    // TODO: this whole section is hacky. Building the vue form builder would solve much of this
    vite: {
        plugins: [
            {
                // Rewrite @/ imports inside vue-form-builder source to relative
                // paths so they resolve against that package's own src/ directory
                // rather than against Nuxt's @ alias (which points to app/).
                name: 'vue-form-builder-transform',
                enforce: 'pre',
                transform(code, id) {
                    if (!id.includes('vue-form-builder/src')) return;
                    const dir = path.dirname(id);
                    return code.replace(
                        /(["'])@\/([^"']+)\1/g,
                        (_match, quote, importPath) => {
                            const absPath = path.resolve(
                                vueFormBuilderSrc,
                                importPath
                            );
                            let relPath = path.relative(dir, absPath);
                            if (!relPath.startsWith('.'))
                                relPath = './' + relPath;
                            return quote + relPath + quote;
                        }
                    );
                },
            },
        ],
        optimizeDeps: {
            // Pre-bundle everything that would otherwise be discovered at
            // runtime and trigger a full dev-server restart / page reload.
            include: [
                '@orpc/client',
                '@orpc/client/fetch',
                '@phosphor-icons/vue',
                '@vue/devtools-core',
                '@vue/devtools-kit',
                'pinia',
                'primevue',
                'primevue/config',
                'primevue/useconfirm',
                'primevue/toastservice',
                'primevue/dialogservice',
                'primevue/confirmationservice',
                '@educorvi/dguv-theme',
                '@vueuse/core',
                'sanitize-html',
                'uuid',
                'deepmerge',
                'fast-deep-equal',
                'vue-draggable-plus',
                '@educorvi/vue-json-form',
            ],
        },
        resolve: {
            alias: {
                // postcss (nested inside sanitize-html) references source-map-js
                // which only works in Node.js. Stub it so it doesn't error out
                // in the browser — the source-map code path is never hit at runtime.
                'source-map-js': path.resolve(__dirname, 'vite/node-mock.js'),
                // The schemas package has not been built (no dist/). Alias it to
                // source so Vite can resolve it directly as TypeScript.
                '@educorvi/vue-json-form-schemas': path.resolve(
                    __dirname,
                    '../../packages/schemas/src/index.ts'
                ),
            },
        },
    },

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
        // importTheme: { from: '@educorvi/uv-theme' },
        options: {
            theme: {
                preset: UVNexusPreset,
                // preset: Aura,
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
