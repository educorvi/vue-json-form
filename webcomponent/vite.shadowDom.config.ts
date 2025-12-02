import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { getConfig } from './vite.config';

export default defineConfig(
    getConfig('./src/mainWithShadowDOM.ce.ts', './dist/shadowDom')
);
