import type { User } from '#auth-utils';
import type { User as DbUser } from '@educorvi/vue-json-forms-builder-db-layer';

export function mapDbRoleToAuthRoles(dbRole: DbUser['role']): User['roles'] {
    switch (dbRole) {
        case 'admin':
            return ['admin', 'user'];
        case 'user':
            return ['user'];
        default:
            return [];
    }
}
export function mapAuthRolesToDbRole(authRoles: User['roles']): DbUser['role'] {
    if (authRoles.includes('admin')) {
        return 'admin';
    }
    return 'user';
}
export function mapDbUserToAuthUser(dbUser: DbUser): User {
    return {
        id: dbUser.id,
        username: dbUser.name,
        email: dbUser.email,
        firstName: dbUser.firstName ?? undefined,
        lastName: dbUser.lastName ?? undefined,
        roles: mapDbRoleToAuthRoles(dbUser.role),
    };
}
