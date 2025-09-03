import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/showcase',
            name: 'showcase',
            component: () => import('../views/showcase.vue'),
        },
        {
            path: '/custom',
            name: 'custom',
            component: () => import('../views/custom.vue'),
        },
        {
            path: '/ui-generator',
            name: 'ui-generator',
            component: () => import('../views/ui-generator.vue'),
        }
    ],
});

export default router;
