import { os } from '../init';
import { statusRouter } from './status';
import { usersRouter } from './users';
import { groupsRouter } from './groups';
import { formsRouter } from './forms';
import { apiKeysRouter } from './api-keys';

export const appRouter = os.router({
    status: statusRouter,
    users: usersRouter,
    groups: groupsRouter,
    forms: formsRouter,
    apiKeys: apiKeysRouter,
});

export type AppRouter = typeof appRouter;
