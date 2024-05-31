import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import Showcase from '@/views/showcase.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
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
        }
    ],
});

export default router;
