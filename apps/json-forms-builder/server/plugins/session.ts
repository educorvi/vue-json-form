import { AppDataSource } from '~~/server/db/data-source';
import { User } from '~~/server/db/entities/User';
import { mapAuthRolesToDbRole } from '~~/server/lib/auth';

/**
 * Session hooks — auto-sync the local `user` table with Keycloak profile
 * data every time the session is fetched (SSR nav + client-side fetch).
 *
 * This guarantees the DB user record always exists and stays up to date
 * without relying on the frontend to send a "create me" request
 * (which would be a security concern).
 */
export default defineNitroPlugin(() => {
    sessionHooks.hook('fetch', async (session) => {
        if (!session.user) return;

        const repo = AppDataSource.getRepository(User);
        const { id, username, email, firstName, lastName, roles } =
            session.user;

        const existing = await repo.findOne({ where: { id } });
        // let existing = await repo.findOne({ where: { id } });

        // // Fallback: look up by email (handles migration from numeric IDs).
        // if (!existing && email) {
        //     const byEmail = await repo.findOne({ where: { email } as any });
        //     if (byEmail) {
        //         // Migrate the old numeric PK to the Keycloak sub UUID
        //         await repo.query(
        //             'UPDATE "user" SET id = $1 WHERE id = $2',
        //             [id, byEmail.id]
        //         );
        //         // Reload under the new PK
        //         existing = await repo.findOne({ where: { id } as any });
        //     }
        // }

        if (existing) {
            // Update fields that may have changed in Keycloak
            // TODO: either always update or do better matching of changes, this it not good
            let changed = false;
            if (existing.name !== username) {
                existing.name = username;
                changed = true;
            }
            if (existing.email !== email) {
                existing.email = email;
                changed = true;
            }
            if (existing.firstName !== (firstName ?? null)) {
                existing.firstName = firstName ?? null;
                changed = true;
            }
            if (existing.lastName !== (lastName ?? null)) {
                existing.lastName = lastName ?? null;
                changed = true;
            }
            const dbRole = mapAuthRolesToDbRole(roles);
            if (existing.role !== dbRole) {
                existing.role = dbRole;
                changed = true;
            }
            if (changed) {
                await repo.save(existing);
            }
        } else {
            // First login — create DB record
            await repo.save(
                repo.create({
                    id,
                    name: username,
                    email,
                    firstName: firstName ?? null,
                    lastName: lastName ?? null,
                    role: mapAuthRolesToDbRole(roles),
                })
            );
        }
    });
});
