import type { User } from '#auth-utils';

/**
 * Augments nuxt-auth-utils' User interface with the fields stored in the
 * Keycloak session (see server/routes/auth/keycloak.get.ts).
 *
 * `id` is the Keycloak `sub` claim (UUID) and doubles as the primary key
 * in the local `user` table — no separate auto-increment ID is needed.
 *
 * This file is picked up automatically by TypeScript because it lives under
 * the project root and Nuxt adds the project root to `typeRoots`.
 */
declare module '#auth-utils' {
    interface User {
        id: string;
        username: string;
        email: string;
        firstName?: string;
        lastName?: string;
        roles: string[];
    }
}

declare module 'h3' {
    interface H3EventContext {
        user?: User;
    }
}

export {};
