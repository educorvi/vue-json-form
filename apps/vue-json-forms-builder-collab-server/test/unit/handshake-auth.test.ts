import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticateConnection, ConnectionAuthError } from '../../src/auth';

function headersWith(entries: Record<string, string>): Headers {
    return new Headers(entries);
}

/**
 * The collab WebSocket accepts handshakes from any origin
 */
describe('collab server — handshake auth (no Origin allowlist)', () => {
    beforeEach(() => {
        // Never talk to a real backend; record the attempt instead.
        vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValue(new Error('network disabled in tests'))
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('rejects a credential-less handshake from any origin on the CREDENTIALS check, not on the origin', async () => {
        const rejection = authenticateConnection(
            null,
            headersWith({
                origin: 'http://evil.com',
            }),
            '1'
        );

        await expect(rejection).rejects.toThrow(ConnectionAuthError);
        await expect(rejection).rejects.toMatchObject({
            reason: 'unauthorized',
            message: expect.stringContaining('no session cookie'),
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('accepts a handshake with no Origin header at all (headless API-key clients send none)', async () => {
        // Reaching the backend proves nothing rejected the handshake up front.
        const rejection = authenticateConnection(
            'fb_something',
            headersWith({}),
            '1'
        );

        await expect(rejection).rejects.toMatchObject({
            reason: 'permission-denied',
            message: expect.stringContaining('backend unreachable'),
        });
        expect(fetch).toHaveBeenCalled();
    });

    it('ignores the Origin header for token handshakes from arbitrary sites', async () => {
        const rejection = authenticateConnection(
            'fb_something',
            headersWith({ origin: 'https://some-customer-site.example' }),
            '42'
        );

        await expect(rejection).rejects.toMatchObject({
            reason: 'permission-denied',
            message: expect.stringContaining('backend unreachable'),
        });
        expect(fetch).toHaveBeenCalled();
    });

    it('still authenticates the cookie path', async () => {
        const rejection = authenticateConnection(
            null,
            headersWith({ cookie: 'nuxt-session=whatever' }),
            '1'
        );

        // The cookie is forwarded to the backend, which is unreachable here —
        // i.e. the cookie-only path still goes through real authentication.
        await expect(rejection).rejects.toMatchObject({
            reason: 'permission-denied',
            message: expect.stringContaining('backend unreachable'),
        });
        expect(fetch).toHaveBeenCalled();
    });

    it('rejects a non-numeric document name before any backend call', async () => {
        const rejection = authenticateConnection(
            'fb_something',
            headersWith({ origin: 'https://app.example' }),
            'some-form-path'
        );

        await expect(rejection).rejects.toMatchObject({
            reason: 'permission-denied',
            message: expect.stringContaining('numeric form ids'),
        });
        expect(fetch).not.toHaveBeenCalled();
    });

    it('starts up without COLLAB_ALLOWED_ORIGINS configured', async () => {
        vi.resetModules();
        delete process.env.COLLAB_ALLOWED_ORIGINS;

        // Regression guard: importing auth used to throw when
        // COLLAB_ALLOWED_ORIGINS was unset, which crash-looped the container.
        const freshAuth =
            (await import('../../src/auth')) as typeof import('../../src/auth');
        expect(freshAuth.authenticateConnection).toBeInstanceOf(Function);
    });
});
