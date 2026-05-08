import { createTRPCNuxtHandler } from 'trpc-nuxt/server';
import { appRouter } from '~~/server/trpc/routers';
import { createTRPCContext } from '~~/server/trpc/init';

export default createTRPCNuxtHandler({
    router: appRouter,
    createContext: createTRPCContext,
});
