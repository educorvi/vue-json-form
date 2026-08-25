import { computed, ref, type Ref } from 'vue';
import type { FormBuilder, CollabConfig } from '../useFormBuilder';
import { createApiClient, resolveCollabDocumentId } from '../api/client';
import { useBackendUser } from './useBackendUser';
import {
    useBuilderAuth,
    type AuthResult,
    type KeycloakAuthConfig,
} from './useBuilderAuth';

export interface UseCollabConnectionOptions {
    backendUrl: Ref<string | undefined>;
    keycloakIdpHint: Ref<string | undefined>;
    keycloak: Ref<KeycloakAuthConfig | undefined>;
    collab: Ref<CollabConfig | null>;
}

/**
 * Collab connection lifecycle: auth (keycloak / backend session / local),
 * resolving a form path to its numeric id (the collab server only accepts
 * ids as document names), connecting the websocket and syncing the backend
 * user for presence.
 */
export function useCollabConnection(
    builder: FormBuilder,
    {
        backendUrl,
        keycloakIdpHint,
        keycloak,
        collab,
    }: UseCollabConnectionOptions
) {
    const authToken = ref<string | undefined>(undefined);

    const {
        mode: authMode,
        checkingAuth,
        loginRequired,
        authError,
        checkAuth,
        login,
    } = useBuilderAuth({
        backendUrl,
        keycloakIdpHint,
        keycloak,
        onAuthenticated: (auth) => void connectCollab(auth),
    });

    async function connectCollab({ token, user }: AuthResult): Promise<void> {
        authToken.value = token ?? collab.value?.token;
        builder.connect({
            token: authToken.value,
            documentName: await resolveDocumentId(),
            user:
                user?.id && user.username
                    ? { id: user.id, name: user.username }
                    : undefined,
        });
    }

    /** The collab server only accepts numeric form ids — resolve a form
     *  path to its id (and validate the credentials) before connecting. */
    async function resolveDocumentId(): Promise<string | undefined> {
        const documentName = collab.value?.documentName;
        if (!documentName || !backendUrl.value) return documentName;
        try {
            const client = createApiClient({
                backendUrl: backendUrl.value,
                token: authToken.value,
            });
            await client.users.create({});
            return await resolveCollabDocumentId(client, documentName);
        } catch (err) {
            console.error(
                '[collab] failed to resolve the form id — the server will reject the connection:',
                err
            );
            return documentName;
        }
    }

    useBackendUser(builder, { backendUrl, token: authToken });

    /** Link to the hosting backend's form editor for the current form. */
    const builderBackendUrl = computed(() => {
        const documentName = collab.value?.documentName;
        if (!backendUrl.value || !documentName) return undefined;
        const base = backendUrl.value.replace(/\/+$/, '');
        return `${base}/forms/edit?path=${encodeURIComponent(documentName)}`;
    });

    return {
        authMode,
        checkingAuth,
        loginRequired,
        authError,
        checkAuth,
        login,
        builderBackendUrl,
    };
}
