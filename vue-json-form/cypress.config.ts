import { defineConfig } from 'cypress';

export default defineConfig({
    component: {
        devServer: {
            framework: 'vue',
            bundler: 'vite',
        },
    },

    e2e: {
        experimentalStudio: true,
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
    },
});
