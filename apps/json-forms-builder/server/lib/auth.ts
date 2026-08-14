import type { User } from '#auth-utils';
import type { User as DbUser } from '../db/entities/User';

/**
 * Short-lived httpOnly cookie that carries the Keycloak access token from
 * the OIDC callback (/auth/keycloak) to the popup-close page
 * (/auth/popup-close), which relays it to the embedding page via
 * postMessage. The webcomponent uses it as bearer token for the collab
 * websocket — the session cookie alone cannot cross browsers with
 * third-party-cookie blocking. The token is deliberately NOT stored in
 * the (client-side) session cookie: it would push it beyond the 4KB
 * cookie size limit.
 */
export const ACCESS_TOKEN_COOKIE = 'vjfb_access_token';

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
