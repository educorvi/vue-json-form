import { createApp } from 'vue';
import { createBootstrap } from 'bootstrap-vue-next';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@educorvi/vue-json-form/dist/vue-json-form.css';

import App from './App.vue';
import './assets/main.css';

const app = createApp(App);

app.use(createBootstrap());

app.mount('#app');
