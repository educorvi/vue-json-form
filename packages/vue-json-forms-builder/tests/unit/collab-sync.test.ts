import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Server } from '@hocuspocus/server';
import {
    HocuspocusProvider,
    type HocuspocusProviderConfiguration,
} from '@hocuspocus/provider';
import WebSocket from 'ws';

/**
 * spin up a real Hocuspocus server in-memory and connect two real HocuspocusProvider clients to it. Covers sync,
 * offline edits + reconnect merge, and awareness (presence/selection).
 */

async function waitFor(
    predicate: () => boolean,
    timeoutMs = 3000
): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error('waitFor: condition not met within timeout');
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
    }
}

function waitForSynced(provider: HocuspocusProvider): Promise<void> {
    if (provider.isSynced) return Promise.resolve();
    return new Promise((resolve) => {
        provider.on('synced', () => resolve());
    });
}

/**
 * `disconnect()`/`connect()` on the underlying websocket are asynchronous
 * (the close/open handshake hasn't finished when the call returns) — calling
 * `connect()` immediately after `disconnect()` can see a stale 'connected'
 * status and silently no-op. Wait for the actual status transition first.
 */
function waitForStatus(
    provider: HocuspocusProvider,
    status: 'connected' | 'disconnected'
): Promise<void> {
    return new Promise((resolve) => {
        provider.on('status', (data: { status: string }) => {
            if (data.status === status) resolve();
        });
    });
}

describe('in-memory Hocuspocus collaboration', () => {
    let server: Server;
    let url: string;
    const clients: HocuspocusProvider[] = [];

    beforeEach(async () => {
        server = new Server({ port: 0, quiet: true });
        await server.listen();
        url = server.webSocketURL;
    });

    afterEach(async () => {
        for (const client of clients.splice(0)) client.destroy();
        await server.destroy();
    });

    function connectClient(): HocuspocusProvider {
        // WebSocketPolyfill is a real, used-at-runtime option (Node has no
        // global WebSocket the provider can default to) — it's just typed
        // on the nested websocket-transport config, not on the flattened
        // options HocuspocusProviderConfiguration exposes when no explicit
        // `websocketProvider` is passed in (the constructor forwards the
        // whole object through either way, see HocuspocusProviderWebsocket's
        // constructor). Passing an explicit `websocketProvider` instead
        // would type-check cleanly but changes runtime behavior — it skips
        // the provider's automatic `attach()`/`manageSocket` wiring, so it
        // never actually connects. Not worth it for a type-only gap in a
        // third-party library: assert the extra field instead.
        const provider = new HocuspocusProvider({
            url,
            name: 'test-doc',
            WebSocketPolyfill: WebSocket,
        } as HocuspocusProviderConfiguration);
        clients.push(provider);
        return provider;
    }

    it('syncs a document change from one client to another', async () => {
        const a = connectClient();
        const b = connectClient();
        await Promise.all([waitForSynced(a), waitForSynced(b)]);

        a.document.getMap('demo').set('title', 'Hello from A');

        await waitFor(
            () => b.document.getMap('demo').get('title') === 'Hello from A'
        );
        expect(b.document.getMap('demo').get('title')).toBe('Hello from A');
    });

    it('merges edits made while offline once the client reconnects', async () => {
        const a = connectClient();
        const b = connectClient();
        await Promise.all([waitForSynced(a), waitForSynced(b)]);

        b.disconnect();
        await waitForStatus(b, 'disconnected');

        // Diverging edits while b is offline — independent keys, so the
        // Yjs CRDT merge is unambiguous.
        b.document.getMap('demo').set('offlineField', 'from B (offline)');
        a.document.getMap('demo').set('onlineField', 'from A (online)');

        // a's edit propagates to nobody but itself while b is disconnected —
        // just confirm it landed locally.
        expect(a.document.getMap('demo').get('onlineField')).toBe(
            'from A (online)'
        );

        b.connect();
        await waitForStatus(b, 'connected');
        await waitForSynced(b);

        await waitFor(
            () =>
                b.document.getMap('demo').get('onlineField') ===
                'from A (online)'
        );
        await waitFor(
            () =>
                a.document.getMap('demo').get('offlineField') ===
                'from B (offline)'
        );

        expect(b.document.getMap('demo').get('offlineField')).toBe(
            'from B (offline)'
        );
        expect(a.document.getMap('demo').get('offlineField')).toBe(
            'from B (offline)'
        );
    });

    it('propagates awareness (presence + element selection) to other clients', async () => {
        const a = connectClient();
        const b = connectClient();
        await Promise.all([waitForSynced(a), waitForSynced(b)]);

        a.setAwarenessField('user', {
            id: 'user-a',
            name: 'Alice',
            color: '#ff0000',
        });
        a.setAwarenessField('selectedElementId', 'field-1');

        await waitFor(() =>
            [...(b.awareness?.getStates().values() ?? [])].some(
                (state) =>
                    (state as { user?: { name?: string } }).user?.name ===
                    'Alice'
            )
        );

        const states = [...(b.awareness?.getStates().values() ?? [])] as Array<{
            user?: { id: string; name: string; color: string };
            selectedElementId?: string;
        }>;
        const aliceState = states.find((s) => s.user?.name === 'Alice');
        expect(aliceState?.user?.id).toBe('user-a');
        expect(aliceState?.selectedElementId).toBe('field-1');

        // Selection changes (e.g. clicking another field) update live too.
        a.setAwarenessField('selectedElementId', 'field-2');
        await waitFor(() =>
            [...(b.awareness?.getStates().values() ?? [])].some(
                (state) =>
                    (state as { selectedElementId?: string })
                        .selectedElementId === 'field-2'
            )
        );
    });
});
