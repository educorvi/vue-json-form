/**
 * Augments nuxt-auth-utils' User interface with the fields stored in the
 * Keycloak session (see server/routes/auth/keycloak.get.ts).
 *
 * This file is picked up automatically by TypeScript because it lives under
 * the project root and Nuxt adds the project root to `typeRoots`.
 */
declare module '#auth-utils' {
    interface User {
        id: string;
        name: string;
        email: string;
        roles: string[];
    }
}

export {};
