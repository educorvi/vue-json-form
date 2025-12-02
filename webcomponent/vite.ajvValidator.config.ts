import { defineConfig } from 'vite';
import { getConfig } from './vite.config';


export default defineConfig(
    getConfig('./src/Webcomponent.AjvValidator.ce.vue', './dist/ajvValidator')
);
