import { defineConfig } from 'vite';
import { mergeConfig } from 'vitest/config';
import vjfConfig from './vite.config.ts';

// https://vitejs.dev/config/
export default mergeConfig(vjfConfig, defineConfig({}), true);
