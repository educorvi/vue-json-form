import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { mergeConfig } from 'vitest/config';
import vjfConfig from './vite.config';

// https://vitejs.dev/config/
export default mergeConfig(vjfConfig, defineConfig({}), true);
