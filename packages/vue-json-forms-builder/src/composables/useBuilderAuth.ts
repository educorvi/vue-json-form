import { ref, watch, onMounted, type Ref } from 'vue';
import Keycloak from 'keycloak-js';

/**
 * The authenticated user — the `user` object of the backend's
 * nuxt-auth-utils session (set in /auth/keycloak) or the claims of a
 * Keycloak access token (keycloak mode).
 */
export interface BackendAuthUser {
    id?: string;
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
}

/**
 * Result of a successful authentication, passed to `onAuthenticated`.
 */
export interface AuthResult {
    /**
     * Bearer token for the collab websocket (a Keycloak access token).
     * Absent in session mode — there the websocket handshake carries the
     * backend session cookie and no token is needed.
     */
    token?: string;
    /** The authenticated user — used for presence/awareness. */
    user?: BackendAuthUser;
}

/**
 * Keycloak login via the `keycloak-js` adapter (PUBLIC client, PKCE) —
 * used when the builder/webcomponent runs embedded in a third-party host.
 *
 * The adapter performs a *silent* `check-sso` on every mount: the login
 * state is checked in a hidden iframe against the Keycloak server, so the
 * embedding page is NEVER navigated when the user already has a session
 * (or a brokered one via `idpHint`). Only when no session exists does the
 * user see a "Sign in" button, which triggers a normal top-level redirect
 * to Keycloak (skipping the login page via `idpHint` when configured).
 *
 * The client MUST be a **public** client in Keycloak (no secret — a
 * browser has no place to hide one; PKCE S256 replaces it). `redirectUris`
 * must include the silent check-sso page and every embedding origin.
 *
 * See also `server/lib/jwt-auth.ts` in the hosting backend: access tokens
 * from this public client (`azp = clientId`) are accepted for the collab
 * websocket when the client id is in `NUXT_AUTH_ALLOWED_CLIENT_IDS`.
 */
export interface KeycloakAuthConfig {
    /** Keycloak server base URL, e.g. "https://sso.example.com/" */
    url: string;
    /** Realm name, e.g. "dev" */
    realm: string;
    /** Public client id (client authentication OFF, PKCE enabled). */
    clientId: string;
    /**
     * `kc_idp_hint` — skip the login page and redirect straight to a
     * federated identity provider (identity brokering). The embedding
     * customer configures their IdP alias in our realm.
     */
    idpHint?: string;
    /**
     * Absolute URL of the silent `check-sso` page. Must be same-origin
     * with the embedding page and listed in the client's `redirectUris`.
     * Defaults to `${location.origin}/silent-check-sso.html` — ship that
     * file (packages/vue-json-forms-builder-webcomponent/public/silent-check-sso.html)
     * into the host app's public directory.
     */
    silentCheckSsoRedirectUri?: string;
    /**
     * Absolute URL to return to after login. Defaults to the current page
     * URL (so the host app stays where it was).
     */
    redirectUri?: string;
}

export type BuilderAuthMode = 'local' | 'session' | 'keycloak';

/**
 * Authentication for the form builder. Three modes, selected by which
 * props are present:
 *
 *   local    — no `backendUrl`, no `keycloak` config: the builder runs
 *              fully local, no authentication, no backend communication.
 *   session  — `backendUrl` set: the builder is hosted by (or embedded
 *              same-site into) a backend using nuxt-auth-utils. The
 *              session is checked via `GET <backendUrl>/api/_auth/session`
 *              (the `nuxt-session` cookie authenticates everything, incl.
 *              the collab websocket handshake). When missing, a "Sign in"
 *              button redirects to `<backendUrl>/auth/keycloak` (with the
 *              current page as `redirect` and `kc_idp_hint` if set).
 *   keycloak — `keycloak` config set (public client): the builder logs in
 *              directly against the Keycloak server via keycloak-js with a
 *              silent `check-sso` (no page navigation when a session or a
 *              brokered session exists). The access token is passed to
 *              `onAuthenticated` — the collab websocket authenticates with
 *              it (`Authorization: Bearer`, validated by the hosting
 *              backend via JWKS), which also works in browsers with
 *              third-party-cookie blocking.
 *
 * On success `onAuthenticated(auth)` is invoked — the consumer connects
 * the collab websocket there (it must not connect before the credentials
 * exist: the handshake would be unauthenticated and the server would
 * reject it — the form would stay empty).
 */
export interface UseBuilderAuthOptions {
    /** Base URL of a hosting backend (nuxt-auth-utils session), e.g. "http://localhost:3000". */
    backendUrl?: Ref<string | undefined>;
    /**
     * Keycloak `kc_idp_hint` appended to the backend's login URL in
     * session mode. (In keycloak mode use `KeycloakAuthConfig.idpHint`.)
     */
    keycloakIdpHint?: Ref<string | undefined>;
    /** Keycloak login config (public client, keycloak-js) — see KeycloakAuthConfig. */
    keycloak?: Ref<KeycloakAuthConfig | undefined>;
    /** Called when authentication is confirmed, with the credentials the collab connection should use. */
    onAuthenticated: (auth: AuthResult) => void;
}

export function useBuilderAuth(options: UseBuilderAuthOptions) {
    const { backendUrl, keycloakIdpHint, keycloak, onAuthenticated } =
        options;

    /** Which auth mode applies, derived from the configured props. */
    const mode = ref<BuilderAuthMode>(
        keycloak?.value ? 'keycloak' : backendUrl?.value ? 'session' : 'local'
    );
    /** true while the session check / silent check-sso runs */
    const checkingAuth = ref(false);
    /** true when the user must log in — show a "Sign in" button */
    const loginRequired = ref(false);
    const authError = ref<string | null>(null);

    let keycloakAdapter: Keycloak | null = null;

    onMounted(checkAuth);
    watch([backendUrl, keycloak, keycloakIdpHint], checkAuth);

    // ── Session mode (hosting backend, nuxt-auth-utils) ─────────────────────

    async function fetchSession(): Promise<unknown> {
        const response = await fetch(`${backendUrl!.value}/api/_auth/session`, {
            credentials: 'include',
        });
        return response.json();
    }

    async function checkSessionAuth() {
        try {
            const session = (await fetchSession()) as { user?: unknown };
            if (session.user) {
                // Session visible — the cookie authenticates the collab
                // websocket handshake, no token needed.
                onAuthenticated({ user: session.user as BackendAuthUser });
            } else {
                loginRequired.value = true;
            }
        } catch (error) {
            authError.value = `Could not reach the backend at ${backendUrl!.value}: ${
                error instanceof Error ? error.message : String(error)
            }`;
        }
    }

    // ── Keycloak mode (public client, keycloak-js) ──────────────────────────

    /** Maps a Keycloak access-token payload to the BackendAuthUser shape. */
    function userFromToken(parsed?: {
        sub?: string;
        preferred_username?: string;
        email?: string;
        given_name?: string;
        family_name?: string;
        realm_access?: { roles?: string[] };
    }): BackendAuthUser | undefined {
        if (!parsed?.sub) return undefined;
        return {
            id: parsed.sub,
            username: parsed.preferred_username ?? parsed.sub,
            email: parsed.email ?? '',
            firstName: parsed.given_name,
            lastName: parsed.family_name,
            roles: parsed.realm_access?.roles,
        };
    }

    async function checkKeycloakAuth() {
        const cfg = keycloak!.value!;
        checkingAuth.value = true;
        try {
            keycloakAdapter = new Keycloak({
                url: cfg.url,
                realm: cfg.realm,
                clientId: cfg.clientId,
            });

            // Keep the access token fresh while the builder is open — the
            // collab websocket authenticates with it.
            keycloakAdapter.onTokenExpired = () => {
                keycloakAdapter
                    ?.updateToken(30)
                    .catch(() => console.error('Failed to refresh Keycloak token'));
            };

            const authenticated = await keycloakAdapter.init({
                onLoad: 'check-sso',
                flow: 'standard', // authorization code + PKCE (S256)
                silentCheckSsoRedirectUri:
                    cfg.silentCheckSsoRedirectUri ??
                    `${location.origin}/silent-check-sso.html`,
                redirectUri: cfg.redirectUri ?? location.href,
                // The session-status iframe is unreliable in embedded /
                // cross-site contexts (tracking protection) and noisy —
                // check-sso re-runs on every mount anyway.
                checkLoginIframe: false,
            });

            if (authenticated) {
                // Make sure the token is valid long enough for the
                // websocket handshake (default validity is 5 min, refresh
                // is transparent after that).
                if (keycloakAdapter.isTokenExpired()) {
                    await keycloakAdapter.updateToken(30);
                }
                onAuthenticated({
                    token: keycloakAdapter.token ?? undefined,
                    user: userFromToken(keycloakAdapter.tokenParsed),
                });
            } else {
                // No session — show the "Sign in" button. The click runs
                // login() (a top-level redirect to Keycloak).
                loginRequired.value = true;
            }
        } catch (error) {
            authError.value = `Keycloak initialization failed: ${
                error instanceof Error ? error.message : String(error)
            }`;
        } finally {
            checkingAuth.value = false;
        }
    }

    // ── Shared ──────────────────────────────────────────────────────────────

    /**
     * Checks the current auth state (session or silent check-sso). Called
     * on mount and whenever the auth props change.
     */
    async function checkAuth() {
        authError.value = null;
        loginRequired.value = false;

        if (keycloak?.value) {
            mode.value = 'keycloak';
            await checkKeycloakAuth();
            return;
        }
        if (backendUrl?.value) {
            mode.value = 'session';
            checkingAuth.value = true;
            try {
                await checkSessionAuth();
            } finally {
                checkingAuth.value = false;
            }
            return;
        }
        mode.value = 'local';
        // No auth configured — the consumer renders the builder and
        // connects immediately (local mode). Nothing to check.
    }

    /**
     * Starts the login. In keycloak mode this is a top-level redirect to
     * Keycloak (via the configured IdP hint when set). In session mode the
     * page is redirected to the backend's /auth/keycloak, which returns to
     * the current URL after login.
     */
    function login() {
        if (keycloak?.value && keycloakAdapter) {
            const cfg = keycloak.value;
            keycloakAdapter.login({
                ...(cfg.idpHint ? { idpHint: cfg.idpHint } : {}),
                redirectUri: cfg.redirectUri ?? location.href,
            });
            return;
        }
        if (backendUrl?.value) {
            const params = new URLSearchParams({ redirect: location.href });
            if (keycloakIdpHint?.value) {
                params.set('kc_idp_hint', keycloakIdpHint.value);
            }
            location.assign(
                `${backendUrl.value}/auth/keycloak?${params.toString()}`
            );
        }
    }

    /** Logs the user out of Keycloak (keycloak mode only). */
    function logout() {
        if (keycloakAdapter?.authenticated) {
            keycloakAdapter.logout({ redirectUri: location.origin });
        }
    }

    return {
        mode,
        checkingAuth,
        loginRequired,
        authError,
        checkAuth,
        login,
        logout,
    };
}
