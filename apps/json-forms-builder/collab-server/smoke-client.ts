/**
 * One-shot smoke test for the Hocuspocus collab server (POC).
 *
 * Connects as a client, applies a change to the Y.Doc, disconnects, and lets
 * the server persist via onStoreDocument. The document name is a form id —
 * use a high id that likely doesn't exist yet; the server creates the row.
 *
 * Run: tsx collab-server/smoke-client.ts 999999
 * Requires the collab server to be running (yarn dev:collab).
 */
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

const documentName = process.argv[2] ?? '999999';
const url = process.env.COLLAB_URL ?? 'ws://localhost:1234';
// The collab server accepts raw API keys (fb_…) — set COLLAB_TOKEN or
// COLLAB_API_KEY. No token = the auth-enabled server rejects the connection.
const token = process.env.COLLAB_TOKEN ?? process.env.COLLAB_API_KEY;

const doc = new Y.Doc();

const provider = new HocuspocusProvider({
    url,
    name: documentName,
    document: doc,
    token,
});

const ROOT = 'root';
const ELEMENTS = 'elements';
const CHILDREN = 'children';

provider.on('synced', (isSynced: boolean) => {
    if (!isSynced) return;
    console.log(`[smoke] synced with server for document "${documentName}"`);

    const root = doc.getMap(ROOT);
    if (root.size === 0) {
        root.set('type', 'form');
        root.set('title', 'Smoke test form');
        root.set('id', documentName);
        root.set('uid', `smoke-${documentName}`);
        root.set('layout', 'VerticalLayout');
        const children = new Y.Array<string>();
        root.set(CHILDREN, children);

        const elements = doc.getMap(ELEMENTS);
        const elUid = `smoke-el-1`;
        const el = new Y.Map();
        el.set('uid', elUid);
        el.set('id', 'name');
        el.set('type', 'string');
        el.set('title', 'Name');
        el.set('hidden', false);
        el.set('required', true);
        el.set('format', 'text');
        elements.set(elUid, el);
        children.push([elUid]);

        console.log('[smoke] applied initial form definition');
    } else {
        console.log(
            '[smoke] document already had content — only reading:',
            root.get('title')
        );
    }

    // give Hocuspocus a moment to broadcast, then disconnect
    setTimeout(() => {
        console.log('[smoke] disconnecting…');
        provider.destroy();
        doc.destroy();
        console.log('[smoke] done — check the server log for a store event');
        process.exit(0);
    }, 3000);
});

provider.on('status', ({ status }: { status: string }) => {
    console.log(`[smoke] provider status: ${status}`);
});

provider.on('error', (err: unknown) => {
    console.error('[smoke] provider error:', err);
    process.exit(1);
});

setTimeout(() => {
    console.error('[smoke] timed out waiting for sync');
    process.exit(1);
}, 15000);
