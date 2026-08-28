import { describe, expect, it, vi } from 'vitest';
import { authenticateConnection, ConnectionAuthError } from '../../src/auth';

function headersWith(entries: Record<string, string>): Headers {
    return new Headers(entries);
}

describe('collab server — Origin allowlist (assertAllowedOrigin via authenticateConnection)', () => {
    it('rejects a handshake from a disallowed origin, before attempting any backend call', async () => {
        const rejection = authenticateConnection(
            null,
            headersWith({
                origin: 'http://evil.com',
                cookie: 'nuxt-session=whatever',
            }),
            '1'
        );

        await expect(rejection).rejects.toThrow(ConnectionAuthError);
        await expect(rejection).rejects.toMatchObject({
            reason: 'unauthorized',
            message: expect.stringContaining('origin'),
        });
    });

    it('rejects a handshake with no Origin header at all', async () => {
        const rejection = authenticateConnection(
            null,
            headersWith({ cookie: 'nuxt-session=whatever' }),
            '1'
        );

        await expect(rejection).rejects.toMatchObject({
            reason: 'unauthorized',
            message: expect.stringContaining('origin'),
        });
    });

    it('lets an allowlisted origin past the Origin check (fails later, on credentials)', async () => {
        // http://localhost:3000 comes from vitest.config.ts's test.env.
        // No cookie/token is set, so this should fail — but on the
        // CREDENTIALS check, not the origin check, proving the origin
        // check let it through.
        const rejection = authenticateConnection(
            null,
            headersWith({ origin: 'http://localhost:3000' }),
            '1'
        );

        await expect(rejection).rejects.toMatchObject({
            reason: 'unauthorized',
            message: expect.stringContaining('no session cookie'),
        });
    });

    it('honors whatever COLLAB_ALLOWED_ORIGINS was set to at startup', async () => {
        vi.resetModules();
        process.env.COLLAB_ALLOWED_ORIGINS =
            'https://app.formbuilder.de,https://ws.formbuilder.de';
        const freshAuth =
            (await import('../../src/auth')) as typeof import('../../src/auth');
        process.env.COLLAB_ALLOWED_ORIGINS = 'http://localhost:3000'; // restore for later tests

        // A configured origin gets past the origin check...
        const allowed = freshAuth.authenticateConnection(
            null,
            headersWith({ origin: 'https://app.formbuilder.de' }),
            '1'
        );
        await expect(allowed).rejects.toMatchObject({
            message: expect.stringContaining('no session cookie'),
        });

        // ...but an origin that would have been the OLD default
        // (localhost:3000) is not allowed under this config — it's not
        // additive to any built-in default, there is none.
        const notAllowed = freshAuth.authenticateConnection(
            null,
            headersWith({ origin: 'http://localhost:3000' }),
            '1'
        );
        await expect(notAllowed).rejects.toMatchObject({
            reason: 'unauthorized',
            message: expect.stringContaining('origin'),
        });
    });

    it('refuses to load at all without COLLAB_ALLOWED_ORIGINS configured', async () => {
        vi.resetModules();
        const previous = process.env.COLLAB_ALLOWED_ORIGINS;
        delete process.env.COLLAB_ALLOWED_ORIGINS;

        await expect(import('../../src/auth')).rejects.toThrow(
            /COLLAB_ALLOWED_ORIGINS is required/
        );

        process.env.COLLAB_ALLOWED_ORIGINS = previous;
    });
});
