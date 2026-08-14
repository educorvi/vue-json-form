/**
 * OIDC login against the customer Keycloak (kc2). The client is
 * confidential (client secret), created in the kc2 admin console — see
 * README.md.
 *
 * Supports an optional `?redirect=` query param that is honored after a
 * successful login (only same-origin paths, see middleware guard below).
 */
export default defineOAuthKeycloakEventHandler({
    async onSuccess(event, { user }) {
        await setUserSession(event, {
            user: {
                id: user.sub as string,
                username: (user.name ?? user.preferred_username) as string,
                email: user.email as string,
                firstName: (user.given_name as string) ?? undefined,
                lastName: (user.family_name as string) ?? undefined,
            },
        });
        const redirect = getQuery(event).redirect;
        // Only allow same-origin redirect targets — this app does not broker
        // other origins (unlike the main json-forms-builder app).
        const target =
            typeof redirect === 'string' &&
            redirect.startsWith('/') &&
            !redirect.startsWith('//')
                ? redirect
                : '/dashboard';
        return sendRedirect(event, target);
    },
    onError(event, error) {
        console.error('[Keycloak OIDC] Error:', error);
        return sendRedirect(event, '/?error=auth_failed');
    },
});
