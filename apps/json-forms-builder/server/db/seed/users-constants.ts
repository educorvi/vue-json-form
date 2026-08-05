/**
 * Constants for the Keycloak dev-realm users (keycloak/dev-realm.json).
 */

import type { User as DbUser } from '../entities/User';

type PermissionRole = DbUser['role'];

export const E2E_USERS: Readonly<Record<E2EUserTypes, E2EUser>> = {
    admin: {
        username: 'test',
        password: 'test',
        email: 'test@educorvi.de',
        name: 'Test User',
        sub: '897f0982-2ae7-445d-aaa1-0da4eb10dec4',
        role: 'admin',
    },
    user2: {
        username: 'user2',
        password: 'test',
        email: 'user2@educorvi.de',
        name: 'John Doe',
        sub: '451a7cd3-2bd1-4458-ae85-691886f14734',
        role: 'user',
    },
    user3: {
        username: 'user3',
        password: 'test',
        email: 'user3@educorvi.de',
        name: 'Form Tester',
        sub: 'f01ae79c-4d47-4070-afbe-1e7957ca9f23',
        role: 'user',
    },
};

export type E2EUser = {
    username: string;
    password: string;
    email: string;
    name: string;
    sub: string;
    role: PermissionRole;
};

export type E2EUserTypes = 'admin' | 'user2' | 'user3';

export const USER_TYPE_LIST: Readonly<E2EUserTypes[]> = Object.keys(
    E2E_USERS
) as E2EUserTypes[];
