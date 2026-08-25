import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

/**
 * Syncs the current Keycloak user into the database exactly once per browser
 * session (tracked via sessionStorage). Re-syncs if the user identity changes
 * (e.g. a different account logs in on the same tab).
 */
export default defineNuxtPlugin((nuxtApp) => {
    const { loggedIn, user } = useUserSession();
    const orpc = nuxtApp.$orpc as RouterClient<AppRouter>;
    const SYNC_KEY = 'user-synced-id';

    const syncUser = () => {
        if (!loggedIn.value || !user.value?.id) return;
        const userId = user.value.id;
        // Avoid calling the endpoint more than once per user per session
        if (sessionStorage.getItem(SYNC_KEY) === userId) return;
        orpc.users
            .create()
            .then(() => sessionStorage.setItem(SYNC_KEY, userId))
            .catch((err) => console.warn('[user-sync]', err));
    };

    // Immediate sync if already logged in when the plugin boots
    syncUser();

    // Sync when the user logs in during the session
    watch(loggedIn, (val) => {
        if (val) syncUser();
        else sessionStorage.removeItem(SYNC_KEY);
    });
});
