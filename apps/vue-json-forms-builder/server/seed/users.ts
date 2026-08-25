import type { DataSource, Repository } from 'typeorm';
import { User } from '@educorvi/vue-json-forms-builder-db-layer';
import { E2E_USERS, type E2EUser } from './users-constants';

/**
 * The Keycloak `test` / `user2` / `user3` users (keycloak/dev-realm.json) mirrored in the app's `user` table. The primary key is the Keycloak `sub`, so the IDs here MUST match the realm export
 */

export interface TestUsers {
    admin: User;
    user2: User;
    user3: User;
}

/**
 * creates the test users (only if they don't exist yet) and returns them.
 */
export async function ensureTestUsers(
    dataSource: DataSource
): Promise<TestUsers> {
    const userRepo = dataSource.getRepository(User);

    const admin = await ensureUser(userRepo, E2E_USERS['admin']);
    const user2 = await ensureUser(userRepo, E2E_USERS['user2']);
    const user3 = await ensureUser(userRepo, E2E_USERS['user3']);

    return { admin, user2, user3 };
}

async function ensureUser(
    repo: Repository<User>,
    props: E2EUser
): Promise<User> {
    let user = await repo.findOne({ where: { email: props.email } });
    if (!user) {
        user = repo.create({
            id: props.sub,
            email: props.email,
            name: props.name,
            role: props.role,
        });
        user = await repo.save(user);
    } else if (user.role !== props.role) {
        user.role = props.role;
        user = await repo.save(user);
    }
    return user;
}
