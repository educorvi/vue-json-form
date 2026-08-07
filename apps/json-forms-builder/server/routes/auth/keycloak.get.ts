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
        return JSON.parse(json) as { realm_access?: { roles?: string[] } };
    } catch {
        return null;
    }
}

export default defineOAuthKeycloakEventHandler({
    async onSuccess(event, { user, tokens }) {
        const roles =
            decodeTokenPayload(tokens.access_token)?.realm_access?.roles ?? [];

        await setUserSession(event, {
            user: {
                id: user.sub as string,
                username: (user.name ?? user.preferred_username) as string,
                email: user.email as string,
                firstName: (user.given_name as string) ?? undefined,
                lastName: (user.family_name as string) ?? undefined,
                roles,
            },
        });
        return sendRedirect(event, '/dashboard');
    },
    onError(event, error) {
        console.error('[Keycloak OIDC] Error:', error);
        return sendRedirect(event, '/login?error=auth_failed');
    },
});
