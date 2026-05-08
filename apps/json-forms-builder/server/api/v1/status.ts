import { appRouter } from '~~/server/trpc/routers';

export default defineEventHandler(async () => {
    const caller = appRouter.createCaller({ apiKey: null });
    return caller.status.get();
});
