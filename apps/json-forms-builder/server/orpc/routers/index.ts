import { os } from '../init';
import { statusRouter } from './status';
import { usersRouter } from './users';
import { groupsRouter } from './groups';
import { formsRouter } from './forms';

export const appRouter = os.router({
    status: statusRouter,
    users: usersRouter,
    groups: groupsRouter,
    forms: formsRouter,
});

export type AppRouter = typeof appRouter;
