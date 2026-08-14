import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { User } from '#auth-utils';

/**
 * Validation of Keycloak access tokens (JWTs) against the realm's JWKS.
 *
 * This is the third authentication path besides the session cookie and
 * `fb_...` API keys (see server/middleware/auth.ts). It exists for
 * clients that cannot rely on the session cookie — the form-builder
 * webcomponent embedded on OTHER domains gets a Keycloak access token
 * through its login popup (see /auth/popup-close) and presents it as
 * `Authorization: Bearer <token>` (the collab server relays it for the
 * websocket handshake exactly like an API key).
 *
 * The token is verified by signature against the Keycloak realm's JWKS
 * (cached after the first fetch) and by `iss` / `aud` / `exp` claims.
 */
interface KeycloakRuntimeConfig {
    serverUrl?: string;
    realm?: string;
    clientId?: string;
}

let keySet: ReturnType<typeof createRemoteJWKSet> | null = null;

function getKeycloakConfig(event: any): KeycloakRuntimeConfig | null {
    const config = useRuntimeConfig(event).oauth?.keycloak as
        KeycloakRuntimeConfig | undefined;
    if (!config?.serverUrl || !config?.realm || !config?.clientId) {
        return null;
    }
    return config;
}

/**
 * Validates a Keycloak access token and maps its claims to the
 * #auth-utils User shape (same fields as the session user set in
 * /auth/keycloak). Returns null when the token is invalid/expired or the
 * realm config is missing — the caller decides how to handle that.
 */
export async function validateKeycloakAccessToken(
    event: any,
    token: string
): Promise<User | null> {
    const config = getKeycloakConfig(event);
    if (!config) return null;

    if (!keySet) {
        keySet = createRemoteJWKSet(
            new URL(
                `${config.serverUrl}/realms/${config.realm}/protocol/openid-connect/certs`
            )
        );
    }

    try {
        // Keycloak sets `aud` to the realm's `account` client (the token is
        // issued for the user's account client, not for the OIDC client that
        // requested it). The requesting client is identified by `azp`
        // (authorized party) — require it to match, but also accept the
        // client id in `aud` for providers that do set it.
        const { payload } = await jwtVerify(token, keySet, {
            issuer: `${config.serverUrl}/realms/${config.realm}`,
        });
        const audiences = Array.isArray(payload.aud)
            ? payload.aud
            : payload.aud
              ? [payload.aud]
              : [];
        if (
            payload.azp !== config.clientId &&
            !audiences.includes(config.clientId)
        ) {
            return null;
        }

        return {
            id: payload.sub ?? '',
            username:
                (payload.preferred_username as string | undefined) ??
                payload.sub ??
                '',
            email: (payload.email as string | undefined) ?? '',
            firstName: payload.given_name as string | undefined,
            lastName: payload.family_name as string | undefined,
            roles:
                (payload.realm_access as { roles?: string[] } | undefined)
                    ?.roles ?? [],
        };
    } catch {
        return null;
    }
}
