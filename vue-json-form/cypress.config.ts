import { defineConfig } from 'cypress';
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin';

const registerCommonTasks = (
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions
) => {
    on('task', {
        log(message) {
            console.log(message);
            return null;
        },
        table(data) {
            console.table(data);
            return null;
        },
    });

    return config;
};

export default defineConfig({
    projectId: 'ecbo8x',
    component: {
        devServer: {
            framework: 'vue',
            bundler: 'vite',
        },
        setupNodeEvents(on, config) {
            return registerCommonTasks(on, config);
        },
    },

    e2e: {
        setupNodeEvents(on, config) {
            cypressGrepPlugin(config);
            return registerCommonTasks(on, config);
        },
    },
});
