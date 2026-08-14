import type { User } from '#auth-utils';

/**
 * GET /api/ws-auth — validate the auth of an incoming WebSocket handshake.
 *
 * The collab server (separate process, ws://localhost:1234) forwards either
 * the `nuxt-session` cookie or an `Authorization: Bearer <api-key>` header
 * from the WebSocket handshake here and only accepts the connection if this
 * endpoint returns a user.
 *
 * Auth is the SAME as every other API route: the global auth middleware
 * (server/middleware/auth.ts) already resolved the session cookie OR the
 * API key into `event.context.user` before this handler runs. We only
 * enforce that one of them was present — no custom checking here.
 */
// TODO: not enough as this allows every user to edit every form. Adjsut endpoint so form id is provided and it is validated if user has write access or role is returned or simply the form js requested by the collab server which includes the role.
export default defineEventHandler((event) => {
    const user = event.context.user as User | undefined;
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Unauthorized',
        });
    }
    return { user };
});
