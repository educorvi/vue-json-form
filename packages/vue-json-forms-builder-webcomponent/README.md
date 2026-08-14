# vue-json-forms-builder-webcomponent

The `@educorvi/vue-json-forms-builder-webcomponent` package wraps the
[Vue JSON Form Builder](../vue-json-form-builder) in a framework-agnostic
[web component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
(`<vue-json-form-builder>`), styles and all, so it can be embedded in any
website — plain HTML, React, Angular, Nuxt, ...

## Usage

```html
<script type="module" src="./dist/vue-json-form-builder.js"></script>

<vue-json-form-builder
  json-schema='{ "type": "object", "properties": { "name": { "type": "string" } } }'
  ui-schema='{ "version": "2.0", "layout": { "type": "VerticalLayout", "elements": [] } }'
></vue-json-form-builder>
```

### Properties (all strings)

| Property               | Description                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `json-schema`          | The form's JSON Schema as a JSON string.                                                                                                 |
| `ui-schema`            | The form's UI Schema as a JSON string (VJF format).                                                                                      |
| `collab-url`           | WebSocket URL of a Hocuspocus collab server to enable realtime collaboration.                                                            |
| `collab-document-name` | Document name (= form id in the backend). Defaults to `default-form`.                                                                    |
| `collab-user-id`       | Current user id (e.g. Keycloak `sub`). Required for awareness.                                                                           |
| `collab-user-name`     | Display name of the current user.                                                                                                        |
| `collab-user-color`    | Color of the current user's presence cursor.                                                                                             |
| `collab-token`         | Auth token for the collab websocket.                                                                                                     |
| `backend-url`          | Base URL of the hosting backend (a Nuxt app using `nuxt-auth-utils`). When set, the component checks the session on that backend before rendering and logs the user in if needed. See [Authentication](#authentication). |
| `keycloak-idp-hint`    | Keycloak `kc_idp_hint` appended to the login URL to skip the login page and redirect straight to a federated identity provider. Only used together with `backend-url`. |

### Events

| Event                    | Payload                                   |
| ------------------------ | ----------------------------------------- |
| `vjfb-change`            | `[jsonSchema: object, uiSchema: object]`  |
| `vjfb-definition-change` | `[definition: object]`                    |

## Authentication

The webcomponent itself contains **no logic** — it is a thin wrapper around
the [`VueJsonFormBuilder`](../vue-json-form-builder) Vue component, and the
authentication flow lives entirely in that component (see
`packages/vue-json-form-builder/src/App.vue`). The `backend-url` and
`keycloak-idp-hint` attributes are simply proxied through.

The flow, as implemented by the Vue component, delegates to the hosting
backend (a Nuxt app using `nuxt-auth-utils`):

1. Set the `backend-url` prop to the base URL of that backend, e.g.
   `http://localhost:3000`.
2. On mount the component calls `GET <backend-url>/api/_auth/session` (the
   `nuxt-auth-utils` session endpoint).
3. If the user is logged in, the form builder renders.
4. If not, the login runs in a small **popup window** — the current page is
   **never navigated**, so the hosting app keeps its state (route, form id,
   …) and does not have to re-render anything after login:
   - The popup opens
     `<backend-url>/auth/keycloak?redirect=/auth/popup-close` — plus
     `&kc_idp_hint=<keycloak-idp-hint>` when the `keycloak-idp-hint` prop
     is set. The backend forwards the hint to Keycloak's authorization
     endpoint, so the hint reaches Keycloak untouched.
   - The popup completes the Keycloak round-trip. The backend sets its
     session cookie and finally redirects the popup to its
     `/auth/popup-close` page, which signals the opener via `postMessage`
     — **including the Keycloak access token and the user** — and closes
     itself. The component also polls the session endpoint as a fallback
     (and to detect a manually closed popup).
   - The component caches the token in `localStorage` (same storage model
     as keycloak-js; expiry is checked against the JWT `exp` claim). On
     later page loads the session is re-checked, but in browsers with
     **third-party-cookie blocking** the session is not visible from the
     embedding page — the cached token is then reused, so no popup is
     needed. This is also why the collab websocket authenticates with the
     token (`Authorization: Bearer`): the session cookie alone cannot
     cross third-party-cookie-blocked browsers. The hosting app needs no
     backend changes beyond the endpoints documented in
     `apps/json-forms-builder/docs/auth/README.md`.
   - If the popup is blocked (by the browser — popup blockers / the
     user-activation rule; the backend cannot block popups), the component
     shows an inline **Sign in** button. Clicking it opens the popup
     within the user gesture, which is never blocked. The hosting page is
     never navigated, so it never has to restore its state.

### Identity brokering (`kc_idp_hint`)

The typical integration scenario is a *customer* (external) identity
provider: the backend's Keycloak has the customer's Keycloak configured as
an identity provider via brokering, and the customer's users are already
logged in there.

Setting `keycloak-idp-hint` to the IdP **alias** configured in the backend's
Keycloak realm (e.g. `external-oidc-example`) makes Keycloak skip its own
login page and redirect the user straight to that identity provider. When
the user already has an SSO session there, they are authenticated in the
backend **without any further input**:

```html
<vue-json-form-builder
  backend-url="http://localhost:3000"
  keycloak-idp-hint="external-oidc-example"
  json-schema="..."
  ui-schema="..."
></vue-json-form-builder>
```

The backend should only redirect to a `redirect` URL it trusts (same origin
or an allowlist) — see the `NUXT_AUTH_ALLOWED_REDIRECT_ORIGINS` setting in
`apps/json-forms-builder`.

## Project Setup

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Build

```sh
yarn build
```

The built bundle (UMD + ES) is written to `dist/` (gitignored — run
`yarn build` once before consuming the package from another workspace
package).

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
yarn build

# Runs the end-to-end tests
yarn test:e2e
```
