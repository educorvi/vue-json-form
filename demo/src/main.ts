import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import '@educorvi/vue-json-form/dist/vue-json-form.css';
import './assets/main.scss';
import 'vue-json-pretty/lib/styles.css';


import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import createBootstrap from 'bootstrap-vue-next';

const app = createApp(App);

app.use(createBootstrap())
app.use(router);

app.mount('#app');
