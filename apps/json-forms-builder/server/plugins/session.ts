import { AppDataSource, User } from '@educorvi/vue-json-forms-builder-db-layer';
import { syncUser } from '~~/server/lib/user-sync';

/**
 * Session hooks — auto-sync the local `user` table with Keycloak profile data every time the session is fetched (SSR nav + client-side fetch).
 */
export default defineNitroPlugin(() => {
    sessionHooks.hook('fetch', async (session) => {
        if (!session.user) return;

        const { id, username, email, firstName, lastName, roles } =
            session.user;
        await syncUser(AppDataSource.getRepository(User), {
            id,
            username,
            email,
            firstName,
            lastName,
            roles,
        });
    });
});
