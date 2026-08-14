import { ACCESS_TOKEN_COOKIE } from '../../lib/auth';

/**
 * Popup close page for the form builder's login popup flow
 * (packages/vue-json-form-builder).
 *
 * After a successful login the Keycloak callback redirects the *popup*
 * window here (relative target `/auth/popup-close` — always allowed by
 * safeRedirect in keycloak.get.ts, no allowlist change needed). This page
 * signals the opener window via postMessage that the session now exists and
 * closes itself. The hosting app's window is never navigated, so it keeps
 * its state (route, form id, …) and the builder simply appears once the
 * session is there.
 *
 * Besides the `complete` signal the page also relays the Keycloak access
 * token (parked in the short-lived ACCESS_TOKEN_COOKIE by the callback) and
 * the session user to the opener. The webcomponent needs the token as
 * bearer credential for the collab websocket in browsers with third-party
 * cookie blocking — the session cookie alone never reaches it there, while
 * this page is same-origin to the backend and can read both.
 *
 * The opener validates `event.origin` (must be this backend) and the
 * message shape before trusting it.
 */
export default eventHandler(async (event) => {
    const session = await getUserSession(event);
    const token = getCookie(event, ACCESS_TOKEN_COOKIE) ?? undefined;
    deleteCookie(event, ACCESS_TOKEN_COOKIE, { path: '/' });

    const payload = {
        source: 'vjfb-auth',
        type: 'complete',
        token,
        user: session.user ?? undefined,
    };

    const html = `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>Authentication complete</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: grid;
            place-items: center;
            height: 100vh;
            margin: 0;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <p>Authentication complete — you can close this window.</p>
    <script>
        if (window.opener) {
            window.opener.postMessage(${JSON.stringify(payload).replace(
                /</g,
                '\\u003c'
            )}, '*');
            window.close();
        }
    </script>
</body>
</html>`;
    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
});
