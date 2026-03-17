import pluginVue from 'eslint-plugin-vue';
import {
    defineConfigWithVueTs,
    vueTsConfigs,
} from '@vue/eslint-config-typescript';
import prettierConfig from '@vue/eslint-config-prettier';
import unusedImports from 'eslint-plugin-unused-imports';

/** @type {import('eslint').Linter.Config[]} */
export default defineConfigWithVueTs(
    {
        ignores: ['dist/**', 'coverage/**', 'tests/**'],
    },
    pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,
    prettierConfig,
    {
        plugins: {
            'unused-imports': unusedImports,
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],
        },
    },
    {
        files: ['**/*.cjs'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    }
);
