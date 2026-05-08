import { statusRouter } from './status';
import { usersRouter } from './users';

export const appRouter = {
    status: statusRouter,
    users: usersRouter,
};

export type AppRouter = typeof appRouter;
