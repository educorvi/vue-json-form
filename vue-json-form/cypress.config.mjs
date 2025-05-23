import { defineConfig } from 'cypress';

export default defineConfig({
    projectId: 'ecbo8x',
    component: {
        devServer: {
            framework: 'vue',
            bundler: 'vite',
        },
    },

    e2e: {
        experimentalStudio: true,
        // setupNodeEvents(on, config) {
        //     // implement node event listeners here
        // },
    },
});
