import { fileURLToPath } from 'node:url';
import { defineConfig, configDefaults, type TestUserConfig } from 'vitest/config';

let reporters: TestUserConfig['reporters'];
if (process.env.CI) {
    reporters = ['dot', ['junit', { suiteName: 'Form Builder Schemas Unit tests' }]];
    if (process.env.GITHUB_ACTIONS) {
        reporters.push('github-actions');
    }
} else {
    reporters = ['default'];
}

export default defineConfig({
    test: {
        environment: 'node',
        exclude: [...configDefaults.exclude],
        root: fileURLToPath(new URL('./', import.meta.url)),
        reporters,
        outputFile: {
            junit: 'test-results/junit-report-unit.xml',
        },
    },
});
