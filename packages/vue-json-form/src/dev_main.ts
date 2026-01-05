import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './_DevViews/main.scss';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css';
import { vBColorMode } from 'bootstrap-vue-next/directives/BColorMode';
import Home from '@/_DevViews/Home.vue';
import { createWebHistory, createRouter } from 'vue-router';
import Showcase from '@/_DevViews/Showcase.vue';
import Reproduce from '@/_DevViews/Reproduce.vue';
import Wizard from '@/_DevViews/Wizard.vue';

const routes = [
    { path: '/', component: Home, name: 'home' },
    { path: '/showcase', component: Showcase, name: 'showcase' },
    { path: '/reproduce', component: Reproduce, name: 'reproduce' },
    { path: '/wizard', component: Wizard, name: 'wizard' },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

const app = createApp(App);

app.directive('b-color-mode', vBColorMode);

app.use(createPinia());
app.use(router);

app.mount('#app');
