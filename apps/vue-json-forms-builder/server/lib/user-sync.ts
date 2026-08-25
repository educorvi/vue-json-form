import type { Repository } from 'typeorm';
import type { User as DbUser } from '@educorvi/vue-json-forms-builder-db-layer';
import { mapAuthRolesToDbRole } from './auth';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    roles: string[];
}

const userDataChanged = (existing: DbUser, profile: UserProfile): boolean =>
    existing.name !== profile.username ||
    existing.email !== profile.email ||
    existing.firstName !== (profile.firstName ?? null) ||
    existing.lastName !== (profile.lastName ?? null) ||
    existing.role !== mapAuthRolesToDbRole(profile.roles);

export async function syncUser(
    repo: Repository<DbUser>,
    profile: UserProfile
): Promise<DbUser> {
    let existing = await repo.findOne({ where: { id: profile.id } });
    if (!existing && profile.email) {
        existing = await repo.findOne({ where: { email: profile.email } });
    }

    if (existing) {
        if (userDataChanged(existing, profile)) {
            repo.merge(existing, {
                name: profile.username,
                email: profile.email,
                firstName: profile.firstName ?? null,
                lastName: profile.lastName ?? null,
                role: mapAuthRolesToDbRole(profile.roles),
            });
            return repo.save(existing);
        }
        return existing;
    }

    return repo.save(
        repo.create({
            id: profile.id,
            name: profile.username,
            email: profile.email,
            firstName: profile.firstName ?? null,
            lastName: profile.lastName ?? null,
            role: mapAuthRolesToDbRole(profile.roles),
        })
    );
}
