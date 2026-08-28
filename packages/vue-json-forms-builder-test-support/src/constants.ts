/**
 * Hostnames of the docker-compose `ci` profile stack
 */
export const HOSTS = {
    /** Main form-builder app + backend API (Keycloak realm `dev`). */
    backend: 'http://localhost:3000',
    /** Third-party host app embedding the webcomponent. */
    externalExampleApp: 'http://external-example-app.localhost:3001',
    /** Primary Keycloak (realm `dev`) — the builder app's own IdP. */
    kc1: 'http://kc1.localhost:8080',
    /** Second Keycloak the external example app logs into directly; kc1 federates to it via the `external-oidc-example` identity broker. */
    externalKeycloak: 'http://external-keycloak.localhost:8081',
    /** Hocuspocus collaboration websocket. */
    collabWs: 'ws://ws.localhost:1234',
} as const;

export const E2E_USERS = {
    admin: { username: 'test', password: 'test' },
    user2: { username: 'user2', password: 'test' },
    user3: { username: 'user3', password: 'test' },
} as const;

export type E2EUserType = keyof typeof E2E_USERS;

export const EXTERNAL_KEYCLOAK_USER = { username: 'test', password: 'test' };

export const BROKERED_TEST_USER = {
    externalUsername: 'broker-test',
    externalPassword: 'test',
    kc1UserId: '94c51589-67e2-4d34-b873-944069e678d0',
};
