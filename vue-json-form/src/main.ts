// import { createApp } from 'vue';
// import { createPinia } from 'pinia';
// import App from './App.vue';
//
// const app = createApp(App);
//
// app.use(createPinia());
//
// app.mount('#app');

import type { RenderInterface } from './RenderInterface';
export type { RenderInterface };

export * from '@/renderings/default/DefaultComponents';
export * from '@/renderings/bootstrap/BootstrapComponents';

import VueJsonForm from '@/components/FormRoot.vue';
export { VueJsonForm };

import './RenderInterface';
