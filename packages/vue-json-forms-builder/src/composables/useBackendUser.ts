import { watch, type Ref } from 'vue';
import type { FormBuilder } from '../useFormBuilder';
import { createApiClient } from '../api/client';

export interface UseBackendUserOptions {
    /** Base URL of the hosting backend (from the `backendUrl` prop). */
    backendUrl: Ref<string | undefined>;
    /**
     * Bearer token for the backend API (Keycloak access token / API key);
     * undefined in session mode (cookie).
     */
    token: Ref<string | undefined>;
}

/**
 * Once the collab websocket is connected, fetch the user row from the
 * backend (`users.me()` on the typed client, `GET /api/v1/users/me`) to
 * display the full name (firstName lastName) in the presence UI instead of
 * the Keycloak username. The collab server upserts the user during the
 * handshake (`POST /api/v1/users`), so the row is guaranteed to exist at
 * this point.
 *
 * Session mode sends the browser cookie (credentials: 'include'); Keycloak
 * / API-key mode sends the bearer token used for the websocket.
 */
export function useBackendUser(
    builder: FormBuilder,
    { backendUrl, token }: UseBackendUserOptions
): void {
    let fetchedUserFor: string | undefined;

    watch(
        () =>
            [
                builder.collabStatus.value,
                backendUrl.value,
                token.value,
                builder.currentUser.value?.id,
            ] as const,
        async ([status, baseUrl, authToken, currentUserId]) => {
            if (
                status !== 'connected' ||
                !baseUrl ||
                !currentUserId ||
                fetchedUserFor === currentUserId
            ) {
                return;
            }
            fetchedUserFor = currentUserId;
            try {
                const me = await createApiClient({
                    backendUrl: baseUrl,
                    token: authToken,
                }).users.me();
                const fullName =
                    [me.firstName, me.lastName].filter(Boolean).join(' ') ||
                    me.name;
                builder.setCurrentUser({ id: me.id, name: fullName });
            } catch {
                // non-fatal — keep the username already in place
            }
        }
    );
}
