import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { H3Event } from 'h3';
import type { User } from '#auth-utils';

/**
 * Keycloak access-token validation.
 *
 * Config source: the SAME runtime config that drives the login route
 * (nuxt-auth-utils OIDC client, env `NUXT_OAUTH_KEYCLOAK_*`) — the
 * validation keyset is the realm's JWKS. No separate config block needed.
 *
 * Access tokens are verified against the realm — but they can be issued
 * for OTHER clients of the realm than the confidential login client. The
 * form-builder webcomponent logs in with a PUBLIC client (keycloak-js,
 * PKCE; `azp = vueformbuilder-embed`), see
 * packages/vue-json-forms-builder/src/composables/useBuilderAuth.ts. Which
 * clients' tokens are accepted is configured via
 * `NUXT_AUTH_ALLOWED_CLIENT_IDS` (comma-separated `azp`/`aud` values,
 * runtime config `auth.allowedClientIds`). Default: only the OIDC client
 * (existing deployments keep working without the new env var).
 */

/**
 * nuxt-auth-utils OIDC client config (env NUXT_OAUTH_KEYCLOAK_*) — typed by
 * Nuxt's generated `RuntimeConfig` (see `.nuxt/types/runtime-config.d.ts`),
 * no local shape/cast needed.
 */
function getOidcConfig(event: H3Event) {
    return useRuntimeConfig(event).oauth.keycloak;
}

/**
 * Client ids whose access tokens are accepted (`azp`/`aud`), from
 * `NUXT_AUTH_ALLOWED_CLIENT_IDS` (comma-separated).
 */
function getAcceptedClientIds(event: H3Event): string[] {
    return useRuntimeConfig(event)
        .auth.allowedClientIds.split(',')
        .map((id) => id.trim())
        .filter(Boolean);
}

let keySet: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Validates a Keycloak access token and maps its claims to the
 * #auth-utils User shape (same fields as the session user set in
 * /auth/keycloak). Returns null when the token is invalid/expired, issued
 * by an unaccepted client, or the realm config is missing — the caller
 * decides how to handle that.
 */
export async function validateKeycloakAccessToken(
    event: H3Event,
    token: string
): Promise<User | null> {
    const config = getOidcConfig(event);
    if (!config.serverUrl || !config.realm || !config.clientId) {
        return null;
    }

    // Accepted client ids: NUXT_AUTH_ALLOWED_CLIENT_IDS, always including
    // the confidential OIDC client of the login route.
    const accepted = getAcceptedClientIds(event);
    if (!accepted.includes(config.clientId)) {
        accepted.push(config.clientId);
    }

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
        // (authorized party) — require it to be accepted, but also accept
        // the client id in `aud` for providers that do set it.
        const { payload } = await jwtVerify(token, keySet, {
            issuer: `${config.serverUrl}/realms/${config.realm}`,
        });
        const audiences = Array.isArray(payload.aud)
            ? payload.aud
            : payload.aud
              ? [payload.aud]
              : [];
        const azp = payload.azp as string | undefined;
        const azpAccepted = azp ? accepted.includes(azp) : false;
        const audAccepted = audiences.some((aud) => accepted.includes(aud));
        if (!azpAccepted && !audAccepted) {
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
