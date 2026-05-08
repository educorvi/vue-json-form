import { router } from '../init';
import { statusRouter } from './status';
import { usersRouter } from './users';

export const appRouter = router({
    status: statusRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
