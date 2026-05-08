import { createTRPCNuxtClient, httpBatchLink } from 'trpc-nuxt/client';
import type { AppRouter } from '~/server/trpc/routers';

// TODO: Replace with a proper auth mechanism (user session, environment, etc.)
const API_KEY = 'dev-secret';

export default defineNuxtPlugin(() => {
    const trpc = createTRPCNuxtClient<AppRouter>({
        links: [
            httpBatchLink({
                url: '/api/trpc',
                headers() {
                    return { 'x-api-key': API_KEY };
                },
            }),
        ],
    });

    return {
        provide: {
            trpc,
        },
    };
});
