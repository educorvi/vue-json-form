import { ref, watch, onMounted, onBeforeUnmount, type Ref } from 'vue';

/**
 * The authenticated user — the `user` object of the backend's
 * nuxt-auth-utils session (set in /auth/keycloak).
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
     * Absent when only the session-cookie path is available (e.g. same-site
     * setups where the websocket handshake carries the cookie anyway).
     */
    token?: string;
    /** The authenticated user — used for presence/awareness. */
    user?: BackendAuthUser;
}

/**
 * Authentication against a hosting backend (a Nuxt app using nuxt-auth-utils).
 *
 * The builder itself performs the complete login flow — the hosting app
 * only provides the `backendUrl`. When the user is not logged in, the
 * login runs in a small POPUP window (see startLoginFlow below) — the
 * current window is never navigated, so the hosting app keeps its state.
 * Only when popups are blocked does the flow fall back to an inline
 * "Sign in" button.
 *
 * Credential paths, in order of preference:
 *   1. Backend session cookie (same-site / browsers without third-party
 *      cookie blocking): `GET <backendUrl>/api/_auth/session` returns the
 *      user; the collab websocket handshake carries the cookie.
 *   2. Cached Keycloak access token (localStorage): when the session is
 *      not visible cross-site (third-party cookie blocking) but a
 *      previously obtained token is still valid, it is reused — no popup.
 *   3. Login popup: `<backendUrl>/auth/keycloak?redirect=/auth/popup-close`
 *      (+ `kc_idp_hint`). The backend sets its session and redirects the
 *      popup to `/auth/popup-close`, which relays the Keycloak access
 *      token + user back via postMessage. The token is cached in
 *      localStorage (XSS caveat: same model as keycloak-js) and passed to
 *      `onAuthenticated` — the collab websocket authenticates with it as
 *      `Authorization: Bearer` (the session cookie cannot cross
 *      third-party-cookie-blocked browsers).
 *
 * On success `onAuthenticated(auth)` is invoked — the consumer connects
 * the collab websocket there (it must not connect before the credentials
 * exist: the handshake would be unauthenticated and the server would
 * reject it — the form would stay empty).
 */
export interface UseBackendAuthOptions {
    /** Base URL of the hosting backend, e.g. "http://localhost:3000". */
    backendUrl: Ref<string | undefined>;
    /**
     * Keycloak `kc_idp_hint` appended to the login URL to skip the login
     * page and redirect straight to a federated identity provider.
     */
    keycloakIdpHint?: Ref<string | undefined>;
    /**
     * Called when the backend session is confirmed (initial check or after
     * login), with the credentials the collab connection should use.
     */
    onAuthenticated: (auth: AuthResult) => void;
}

export function useBackendAuth(options: UseBackendAuthOptions) {
    const { backendUrl, keycloakIdpHint, onAuthenticated } = options;

    /** true while the session check is running or the login popup is open */
    const checkingAuth = ref(false);
    /** true while the login popup window is open (spinner copy) */
    const authPopupOpen = ref(false);
    /** true when the popup was blocked — show a "Sign in" button instead */
    const loginRequired = ref(false);
    const authError = ref<string | null>(null);

    let authPopup: Window | null = null;
    let authPollTimer: ReturnType<typeof setInterval> | undefined;
    let authPollTimeout: ReturnType<typeof setTimeout> | undefined;
    let authListeners: (() => void)[] = [];

    onMounted(checkAuth);
    watch(backendUrl, checkAuth);

    // ── Keycloak access token cache (localStorage) ──────────────────────────
    // The token is obtained through the login popup (popup-close relays it)
    // and cached so subsequent page loads in third-party-cookie-blocked
    // browsers don't need another popup. Same storage model as keycloak-js
    // (XSS caveat documented in the file header). Keyed per backend origin.
    const TOKEN_CACHE_PREFIX = 'vjfb-auth-token:';

    function tokenCacheKey(): string {
        return backendUrl.value
            ? `${TOKEN_CACHE_PREFIX}${new URL(backendUrl.value).origin}`
            : '';
    }

    /** Decodes the `exp` claim of a JWT (seconds since epoch). */
    function decodeJwtExp(token: string): number | undefined {
        try {
            const payload = token.split('.')[1];
            if (!payload) return undefined;
            const json = new TextDecoder().decode(
                Uint8Array.from(
                    atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
                    (c) => c.charCodeAt(0)
                )
            );
            const claims = JSON.parse(json) as { exp?: unknown };
            return typeof claims.exp === 'number' ? claims.exp : undefined;
        } catch {
            return undefined;
        }
    }

    /** Returns the cached token when present and not yet expired. */
    function getCachedToken(): string | undefined {
        const key = tokenCacheKey();
        if (!key) return undefined;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return undefined;
            const parsed = JSON.parse(raw) as {
                token?: string;
                exp?: number;
            };
            if (!parsed.token) return undefined;
            if (
                typeof parsed.exp === 'number' &&
                parsed.exp * 1000 < Date.now()
            ) {
                localStorage.removeItem(key);
                return undefined;
            }
            return parsed.token;
        } catch {
            return undefined;
        }
    }

    function cacheToken(token: string): void {
        const key = tokenCacheKey();
        if (!key) return;
        try {
            const exp = decodeJwtExp(token);
            localStorage.setItem(
                key,
                JSON.stringify(exp ? { token, exp } : { token })
            );
        } catch {
            /* storage unavailable (private mode etc.) — popup will re-run */
        }
    }

    /**
     * Checks the backend session. When the user is not logged in, starts the
     * popup login flow instead of redirecting the page:
     *
     * - The current window stays untouched (route, form state, …) — the
     *   hosting app never has to re-render or restore state after login.
     * - The popup completes the Keycloak round-trip; the backend sets its
     *   session cookie (cookies are per-host, so the main window immediately
     *   has the session too) and finally redirects the popup to the backend's
     *   `/auth/popup-close` page, which signals the opener via postMessage
     *   (including the Keycloak access token) and closes itself.
     * - The opener also polls `GET /api/_auth/session` as a fallback and to
     *   detect a manually closed popup.
     *
     * In browsers with third-party-cookie blocking the session check sees no
     * user even when the backend session exists. A cached, unexpired
     * Keycloak access token is then reused directly (no popup); otherwise
     * the popup runs — the token it returns is cached for the next load.
     *
     * Popups are blocked by the CLIENT (browser popup blockers and the
     * user-activation requirement: window.open outside a direct user gesture
     * is rejected) — never by the backend. `window.open` returns null when
     * blocked; the component then shows an inline "Sign in" button instead.
     * Clicking it opens the popup synchronously within the user gesture, so
     * the popup is always allowed. The hosting app never has to restore
     * state, in any case.
     */
    async function checkAuth() {
        authError.value = null;
        authPopupOpen.value = false;
        loginRequired.value = false;
        if (!backendUrl.value) {
            // No backend configured — render the builder without authentication.
            checkingAuth.value = false;
            onAuthenticated({});
            return;
        }

        checkingAuth.value = true;
        try {
            const session = (await fetchSession()) as { user?: unknown };
            if (session.user) {
                // Session visible (same-site / cookies allowed). Pass the
                // cached token too — it is valid and lets the collab
                // websocket authenticate even if the cookie path fails.
                checkingAuth.value = false;
                onAuthenticated({ token: getCachedToken() });
                return;
            }
            // No session visible. Reuse a valid cached token if we have one —
            // saves a popup on every page load in cross-site setups.
            const cached = getCachedToken();
            if (cached) {
                checkingAuth.value = false;
                onAuthenticated({ token: cached });
                return;
            }
            startLoginFlow();
        } catch (error) {
            authError.value = `Could not reach the backend at ${backendUrl.value}: ${
                error instanceof Error ? error.message : String(error)
            }`;
            checkingAuth.value = false;
        }
    }

    function buildLoginUrl(redirect: string): string {
        const params = new URLSearchParams();
        if (keycloakIdpHint?.value) {
            params.set('kc_idp_hint', keycloakIdpHint.value);
        }
        params.set('redirect', redirect);
        return `${backendUrl.value}/auth/keycloak?${params.toString()}`;
    }

    async function fetchSession(): Promise<unknown> {
        const response = await fetch(`${backendUrl.value}/api/_auth/session`, {
            credentials: 'include',
        });
        return response.json();
    }

    function startLoginFlow() {
        stopAuthPolling();
        authError.value = null;

        // The popup is redirected to the backend's popup-close page after
        // login (same-origin relative path — always allowed by the backend's
        // redirect allowlist). That page tells us via postMessage that the
        // session exists, then closes itself.
        const popup = window.open(
            buildLoginUrl('/auth/popup-close'),
            'vjfb-auth',
            'popup=yes,width=520,height=640'
        );
        if (!popup) {
            // Popup blocked by the browser (popup blocker / no user gesture —
            // e.g. when checkAuth ran on mount). Show a "Sign in" button; its
            // click handler calls startLoginFlow() synchronously within the
            // user gesture, which is never blocked. The page is NEVER
            // redirected, so the hosting app keeps its state.
            checkingAuth.value = false;
            loginRequired.value = true;
            return;
        }
        loginRequired.value = false;
        authPopup = popup;
        authPopupOpen.value = true;

        const backendOrigin = new URL(backendUrl.value!).origin;
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== backendOrigin) return;
            const data = event.data as {
                source?: string;
                type?: string;
                token?: string;
                user?: BackendAuthUser;
            } | null;
            if (
                data &&
                data.source === 'vjfb-auth' &&
                data.type === 'complete'
            ) {
                // The backend's popup-close page relays the Keycloak access
                // token + session user here (see server/routes/auth/popup-close.get.ts).
                if (data.token) cacheToken(data.token);
                onAuthSuccess({
                    token: data.token ?? getCachedToken(),
                    user: data.user,
                });
            }
        };
        window.addEventListener('message', onMessage);
        authListeners.push(() =>
            window.removeEventListener('message', onMessage)
        );

        // Fallback polling — also detects a manually closed popup.
        authPollTimer = setInterval(() => {
            if (authPopup?.closed) {
                authError.value =
                    'The login window was closed before authentication completed. Please try again.';
                stopAuthPolling();
                authPopup = null;
                authPopupOpen.value = false;
                checkingAuth.value = false;
                return;
            }
            fetchSession()
                .then((session) => {
                    if ((session as { user?: unknown })?.user) {
                        onAuthSuccess({ token: getCachedToken() });
                    }
                })
                .catch(() => {
                    /* backend unreachable — keep polling */
                });
        }, 600);
        authPollTimeout = setTimeout(
            () => {
                authError.value = 'Login timed out. Please try again.';
                stopAuthPolling();
                authPopup?.close();
                authPopup = null;
                authPopupOpen.value = false;
                checkingAuth.value = false;
            },
            3 * 60 * 1000
        );
    }

    function onAuthSuccess(auth: AuthResult) {
        stopAuthPolling();
        authPopup?.close();
        authPopup = null;
        authPopupOpen.value = false;
        loginRequired.value = false;
        checkingAuth.value = false;
        // The credentials exist now — the consumer connects the collab
        // websocket (see onAuthenticated) with the token/user. It must not
        // connect earlier: the handshake would be unauthenticated and the
        // server would reject it (form would stay empty forever).
        onAuthenticated(auth);
    }

    function stopAuthPolling() {
        if (authPollTimer) {
            clearInterval(authPollTimer);
            authPollTimer = undefined;
        }
        if (authPollTimeout) {
            clearTimeout(authPollTimeout);
            authPollTimeout = undefined;
        }
        authListeners.forEach((remove) => remove());
        authListeners = [];
    }

    onBeforeUnmount(() => {
        stopAuthPolling();
        authPopup?.close();
        authPopup = null;
    });

    return {
        checkingAuth,
        authPopupOpen,
        loginRequired,
        authError,
        checkAuth,
        startLoginFlow,
    };
}
