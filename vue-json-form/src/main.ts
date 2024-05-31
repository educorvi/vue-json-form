// import { createApp } from 'vue';
// import { createPinia } from 'pinia';
// import App from './App.vue';
//
// const app = createApp(App);
//
// app.use(createPinia());
//
// app.mount('#app');

import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

export type { RenderInterface } from './RenderInterface';
// export type * from '@/typings/ui-schema';

export * from '@/renderings/plain/PlainComponents';
export * from '@/renderings/bootstrap/BootstrapComponents';

import VueJsonForm from '@/components/FormRoot.vue';
export { VueJsonForm };

export type * from '@/typings/ui-schema';
export type * from '@/typings/json-schema';
export type * from '@/typings/customTypes';
export * from '@/typings/typeValidators';
export { generateUISchema } from '@/Commons';

import './RenderInterface';
// import '@/typings/ui-schema';
