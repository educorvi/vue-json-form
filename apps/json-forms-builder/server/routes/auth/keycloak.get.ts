export default defineOAuthKeycloakEventHandler({
    async onSuccess(event, { user }) {
        await setUserSession(event, {
            user: {
                id: user.sub as string,
                name: (user.name ?? user.preferred_username) as string,
                email: user.email as string,
                roles:
                    (user as { realm_access?: { roles?: string[] } })
                        .realm_access?.roles ?? [],
            },
        });
        return sendRedirect(event, '/dashboard');
    },
    onError(event, error) {
        console.error('[Keycloak OIDC] Error:', error);
        return sendRedirect(event, '/login?error=auth_failed');
    },
});
