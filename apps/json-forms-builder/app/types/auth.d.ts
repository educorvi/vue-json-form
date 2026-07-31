/**
 * Augments nuxt-auth-utils' User interface on the client side.
 *
 * Mirrors the server-side augmentation in `server/types/auth.d.ts` so that
 * client plugins (e.g. `app/plugins/user-sync.client.ts`) can access
 * `user.value.id` etc. without type errors.
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

export {};
