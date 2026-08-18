import {
    AppDataSource,
    User as DbUser,
} from '@educorvi/vue-json-forms-builder-db-layer';
import { ApiKeyService } from '~~/server/services/ApiKeyService';
import { ORPCError } from '@orpc/server';
import type { User } from '#auth-utils';
import { mapDbUserToAuthUser } from '../lib/auth';
import { validateKeycloakAccessToken } from '../lib/jwt-auth';

/**
 * Auth middleware — reads the session or a bearer token and attaches the
 * user to event context.
 *
 * Authentication priority:
 * 1. Session-based auth (OIDC / nuxt-auth-utils)
 * 2. Bearer token: API key (`fb_...`) or Keycloak access token (JWT)
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

    // 2. Try bearer token auth (API key, then Keycloak access token)
    const authHeader = getHeader(event, 'authorization');
    if (authHeader) {
        const user = await authenticateBearerToken(event, authHeader);
        event.context.user = user;
        return;
    }

    // No auth provided
    // event.context.user = undefined;
    // throw new ORPCError('UNAUTHORIZED', {
    //     message: 'Missing Authorization header',
    // });
});

/**
 * Validate a bearer token from the Authorization header. Tries the API key
 * service first (local DB lookup), then Keycloak access token validation
 * (JWKS signature + iss/aud/exp). Throws an ORPCError with 'UNAUTHORIZED'
 * when neither matches.
 */
async function authenticateBearerToken(
    event: any,
    authHeader: string
): Promise<User> {
    // a) API key (fb_...)
    try {
        const user = await validateBearerHeader(authHeader);
        return mapDbUserToAuthUser(user);
    } catch {
        // not an API key — fall through to Keycloak access token below
    }

    // b) Keycloak access token (JWT) — used by the form-builder
    //    webcomponent in cross-site setups where the session cookie
    //    cannot cross third-party-cookie blocking (see lib/jwt-auth.ts).
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : '';
    if (token) {
        const user = await validateKeycloakAccessToken(event, token);
        if (user) return user;
    }

    throw new ORPCError('UNAUTHORIZED', {
        message: 'Invalid authorization token',
    });
}

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
