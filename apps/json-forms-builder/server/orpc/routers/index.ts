import { os } from '../init';
import { statusRouter } from './status';
import { usersRouter } from './users';
import { groupsRouter } from './groups';

export const appRouter = os.router({
    status: statusRouter,
    users: usersRouter,
    groups: groupsRouter,
});

export type AppRouter = typeof appRouter;
