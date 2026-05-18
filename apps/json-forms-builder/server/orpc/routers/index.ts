import { os } from '../init';
import { statusRouter } from './status';
import { usersRouter } from './users';

/**
 * .router() is essential — it type-checks the full implementation against
 * the contract and enforces it at runtime (input/output validation, HTTP
 * method + path, security schemes).
 */
export const appRouter = os.router({
    status: statusRouter,
    users: usersRouter,
});

export type AppRouter = typeof appRouter;
