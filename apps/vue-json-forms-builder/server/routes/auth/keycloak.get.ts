import { randomUUID } from 'node:crypto';
import type { H3Event } from 'h3';

/**
 * Decodes the payload of a JWT (access token) without dependencies.
 *
 * Keycloak includes the user's realm roles in the token claims under
 * `realm_access.roles` —TODO: maybe userinfo endpoint can expose them as well?
 */
function decodeTokenPayload(token: string): {
    realm_access?: { roles?: string[] };
} | null {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        const json = Buffer.from(payload, 'base64url').toString('utf8');
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Validates the `redirect` query param of the login request against a
 * allowlist so external apps (e.g. the webcomponent demo embedding the form
 * builder) can send the user back after login — without allowing open
 * redirects. Same-origin relative paths are always allowed.
 *
 * Allowed origins come from `NUXT_AUTH_ALLOWED_REDIRECT_ORIGINS`
 * (comma-separated), e.g. `http://external-example-app.localhost:3001`.
 */
function safeRedirect(event: H3Event, candidate: unknown): string {
    if (typeof candidate !== 'string' || candidate.length === 0) {
        return '/dashboard';
    }
    if (candidate.startsWith('/') && !candidate.startsWith('//')) {
        return candidate;
    }
    const allowed = useRuntimeConfig(event)
        .auth.allowedRedirectOrigins.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    if (
        allowed.some(
            (origin) =>
                candidate === origin || candidate.startsWith(`${origin}/`)
        )
    ) {
        return candidate;
    }
    return '/dashboard';
}

const REDIRECT_COOKIE = 'auth_redirect';

/**
 * Keycloak OIDC login, implemented manually instead of
 * `defineOAuthKeycloakEventHandler` so we can persist the `redirect` target
 * across the OAuth round-trip:
 *
 * - nuxt-auth-utils forwards unknown query params (kc_idp_hint, redirect)
 *   to Keycloak's authorization URL, but Keycloak only echoes back
 *   `code`/`state` — the `redirect` param would be lost on the callback.
 * - Therefore the (allowlist-checked) redirect target is stored in an
 *   httpOnly cookie together with the OAuth `state` (CSRF protection) and
 *   restored on the callback.
 *
 * `kc_idp_hint` is still forwarded to Keycloak, so the user can be sent
 * straight to a federated identity provider (identity brokering).
 */
export default eventHandler(async (event) => {
    const config = useRuntimeConfig(event).oauth?.keycloak;
    const query = getQuery(event);

    if (
        !config?.clientId ||
        !config.clientSecret ||
        !config.serverUrl ||
        !config.realm
    ) {
        console.error('[Keycloak OIDC] Missing configuration');
        return sendRedirect(event, '/login?error=auth_failed');
    }

    const realmURL = `${config.serverUrl}/realms/${config.realm}`;
    const redirectURI = `${getRequestURL(event).origin}/auth/keycloak`;

    if (!query.code) {
        // --- Initiation: save the redirect target, then go to Keycloak ---
        const target = safeRedirect(event, query.redirect);
        const state = randomUUID();
        setCookie(event, REDIRECT_COOKIE, JSON.stringify({ target, state }), {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 10 * 60,
            path: '/',
        });

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: redirectURI,
            scope: 'openid',
            response_type: 'code',
            state,
        });
        if (typeof query.kc_idp_hint === 'string' && query.kc_idp_hint) {
            params.set('kc_idp_hint', query.kc_idp_hint);
        }

        return sendRedirect(
            event,
            `${realmURL}/protocol/openid-connect/auth?${params.toString()}`
        );
    }

    // --- Callback: exchange the code, create the session, redirect back ---
    const saved = parseJSONCookie<{ target?: string; state?: string }>(
        event,
        REDIRECT_COOKIE
    );
    deleteCookie(event, REDIRECT_COOKIE, { path: '/' });

    if (
        !saved ||
        typeof query.state !== 'string' ||
        saved.state !== query.state
    ) {
        console.error('[Keycloak OIDC] Invalid or missing OAuth state');
        return sendRedirect(event, '/login?error=auth_failed');
    }

    try {
        const tokens = await $fetch<{ access_token: string }>(
            `${realmURL}/protocol/openid-connect/token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    redirect_uri: redirectURI,
                    code: query.code as string,
                }),
            }
        );

        const user = await $fetch<KeycloakUserInfo>(
            `${realmURL}/protocol/openid-connect/userinfo`,
            {
                headers: {
                    Authorization: `Bearer ${tokens.access_token}`,
                    Accept: 'application/json',
                },
            }
        );

        const roles =
            decodeTokenPayload(tokens.access_token)?.realm_access?.roles ?? [];

        await setUserSession(event, {
            user: {
                id: user.sub,
                username: user.name ?? user.preferred_username ?? user.sub,
                email: user.email ?? '',
                firstName: user.given_name,
                lastName: user.family_name,
                roles,
            },
        });

        return sendRedirect(event, saved.target ?? '/dashboard');
    } catch (error) {
        console.error('[Keycloak OIDC] Error:', error);
        return sendRedirect(event, '/login?error=auth_failed');
    }
});

/**
 * Reads and JSON-parses a cookie, returning null when missing/invalid.
 */
function parseJSONCookie<T>(event: H3Event, name: string): T | null {
    const raw = getCookie(event, name);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/** The subset of the Keycloak `/userinfo` response this route relies on. */
interface KeycloakUserInfo {
    sub: string;
    name?: string;
    preferred_username?: string;
    email?: string;
    given_name?: string;
    family_name?: string;
}
