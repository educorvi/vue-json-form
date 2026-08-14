# Authentication

The application supports three ways to authenticate a request. The global
auth middleware (`server/middleware/auth.ts`) resolves them in this order and
attaches the user to `event.context.user`; protected oRPC procedures throw
`UNAUTHORIZED` when no user was resolved. The same middleware also protects
`GET /api/ws-auth`, which the collab server (separate process) calls to
validate WebSocket handshakes.

## 1. Session cookie (OIDC login)

`GET /auth/keycloak` runs the Keycloak authorization-code flow
(`server/routes/auth/keycloak.get.ts`, manual implementation so the
`?redirect=` target survives the OAuth round-trip via an httpOnly cookie).
On success a nuxt-auth-utils session is created and the browser gets the
`nuxt-session` cookie. Requests carrying the cookie resolve the session via
`getUserSession()`.

The login supports two entry points:

- **This app's own UI** — links to `/auth/keycloak`; after login the user is
  redirected to `/dashboard` (or a same-origin `?redirect=` path).
- **The form-builder webcomponent in external apps** — opens
  `/auth/keycloak?redirect=/auth/popup-close&kc_idp_hint=...` in a popup.
  The popup-close page (`server/routes/auth/popup-close.get.ts`) signals the
  opener via postMessage and relays the Keycloak access token (see below).

`kc_idp_hint` is forwarded to Keycloak, so users can be sent straight to a
federated identity provider (identity brokering).

## 2. API keys (`fb_...`)

Static keys created in the app's API-key management. Sent as
`Authorization: Bearer fb_...`; validated against the database by
`ApiKeyService` (SHA-256 hash). Mainly intended for server-to-server
integration.

## 3. Keycloak access tokens (JWT)

The webcomponent embedded on **other domains** cannot rely on the session
cookie: browsers with third-party-cookie blocking never send it. Instead the
login popup relays the Keycloak **access token** to the embedding page
(see below), and the webcomponent presents it as `Authorization: Bearer <jwt>`
— the collab server forwards it for the websocket handshake exactly like an
API key. `server/lib/jwt-auth.ts` validates signature (realm JWKS, cached),
`iss`, `aud` and `exp` with `jose` and maps the claims to the same user shape
as the session user.

## Webcomponent flow (cross-site, no customer backend)

1. The webcomponent checks `GET <backendUrl>/api/_auth/session` (CORS-enabled
   via `server/plugins/cors.ts` for allowlisted origins).
2. No visible session → popup to
   `<backendUrl>/auth/keycloak?redirect=/auth/popup-close&kc_idp_hint=...`.
3. The backend completes the OIDC round-trip (cookie+state CSRF protection),
   creates the session and parks the access token in a short-lived httpOnly
   cookie (`vjfb_access_token`, maxAge 120s — deliberately NOT in the session
   cookie, which would exceed the 4KB size limit).
4. The popup is redirected to `/auth/popup-close`, which reads the token and
   the session user server-side and postMessages `{ source: 'vjfb-auth',
   type: 'complete', token, user }` to the opener.
5. The webcomponent caches the token in localStorage (same model as
   keycloak-js; expiry checked against the JWT `exp` claim) and connects the
   collab websocket with `token` — the collab server relays it to
   `/api/ws-auth`, the middleware validates it as a Keycloak access token.
6. Subsequent page loads reuse the cached token when valid — no popup.

Same-site integrations keep working with the session cookie alone.


