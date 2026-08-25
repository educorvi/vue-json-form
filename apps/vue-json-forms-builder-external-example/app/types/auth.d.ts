/**
 * Augments nuxt-auth-utils' User interface with the fields stored in the
 * session by `server/routes/auth/keycloak.get.ts`.
 */
declare module '#auth-utils' {
    interface User {
        id: string;
        username: string;
        email: string;
        firstName?: string;
        lastName?: string;
    }
}

export {};
