import { fileURLToPath } from 'node:url';
import {
    mergeConfig,
    defineConfig,
    configDefaults,
    TestUserConfig,
} from 'vitest/config';
import viteConfig from './vite.config';
import { resolve } from 'node:path';

let reporters: TestUserConfig['reporters'];
if (process.env.CI) {
    reporters = ['dot', ['junit', { suiteName: 'AJV Validator Unit tests' }]];
    if (process.env.GITHUB_ACTIONS) {
        reporters.push('github-actions');
    }
} else {
    reporters = ['default'];
}

export default mergeConfig(
    viteConfig,
    defineConfig({
        resolve: {
            alias: {
                './generated/validatorCode.cjs': resolve(__dirname, 'src/generated/validatorCode.cjs'),
            },
        },
        test: {
            environment: 'node',
            exclude: [...configDefaults.exclude],
            root: fileURLToPath(new URL('./', import.meta.url)),
            reporters,
            outputFile: {
                junit: 'test-results/junit-report-unit.xml',
            },
        },
    })
);
