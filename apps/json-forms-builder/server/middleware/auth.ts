import { AppDataSource } from '~~/server/db/data-source';
import { ApiKeyService } from '~~/server/services/ApiKeyService';
import { User as DbUser } from '~~/server/db/entities/User';
import { ORPCError } from '@orpc/server';
import { mapDbUserToAuthUser } from '../lib/auth';

/**
 * Auth middleware — reads the session or API key and attaches the user
 * to event context.
 *
 * Authentication priority:
 * 1. Session-based auth (OIDC / nuxt-auth-utils)
 * 2. API key via `Authorization: Bearer <token>` header
 *
 * Protected procedures in the oRPC router throw UNAUTHORIZED if
 * context.user is null.
 * This middleware does NOT throw — auth enforcement is at the procedure level.
 */
export default defineEventHandler(async (event) => {
    // 1. Try session-based auth first
    const session = await getUserSession(event).catch(() => null);
    if (session?.user) {
        event.context.user = session.user;
        return;
    }

    // 2. Try API key auth
    const authHeader = getHeader(event, 'authorization');
    if (authHeader) {
        const user = await validateBearerHeader(authHeader);
        event.context.user = mapDbUserToAuthUser(user);
        return;
    }

    // No auth provided
    // event.context.user = undefined;
    // throw new ORPCError('UNAUTHORIZED', {
    //     message: 'Missing Authorization header',
    // });
});

/**
 * Validate an API key token from the Authorization header and return the associated user if valid.
 * Throws an ORPCError with 'UNAUTHORIZED' if the token is invalid or expired.
 * @param authHeader The Authorization header containing the Bearer token.
 * @returns The User associated with the valid API key.
 * @throws ORPCError if the token is invalid or expired.
 */
async function validateBearerHeader(authHeader: string): Promise<DbUser> {
    if (!authHeader.startsWith('Bearer '))
        throw new ORPCError('UNAUTHORIZED', {
            message: `Invalid authorization header format. Token must start with "Bearer ", but received token starting with "${authHeader.slice(0, 7)}..."`,
        });
    const token = authHeader.slice(7).trim();
    if (!token)
        throw new ORPCError('UNAUTHORIZED', {
            message: 'Authorization header is missing a token after "Bearer "',
        });
    const service = new ApiKeyService(AppDataSource);
    return service.validateToken(token);
}
