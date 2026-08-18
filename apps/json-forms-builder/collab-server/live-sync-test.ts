import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';

const documentName = process.argv[2] ?? '888888';
const url = process.env.COLLAB_URL ?? 'ws://localhost:1234';
// The collab server accepts raw API keys (fb_…) — set COLLAB_TOKEN or
// COLLAB_API_KEY. No token = the auth-enabled server rejects the connection.
const token = process.env.COLLAB_TOKEN ?? process.env.COLLAB_API_KEY;

const ROOT = 'root';
const ELEMENTS = 'elements';

async function makeProvider(client: string): Promise<{
    provider: HocuspocusProvider;
    doc: Y.Doc;
}> {
    const doc = new Y.Doc();
    const provider = new HocuspocusProvider({
        url,
        name: documentName,
        document: doc,
        token,
        onSynced: ({ state }) => {
            if (!state) return;
            console.log(`[${client}] synced`);
        },
        onStatus: ({ status }: { status: string }) => {
            console.log(`[${client}] status: ${status}`);
        },
    });
    return { provider, doc };
}

async function waitFor(
    cond: () => boolean,
    label: string,
    timeoutMs = 10000
): Promise<void> {
    const start = Date.now();
    while (!cond()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error(`timeout waiting for ${label}`);
        }
        await new Promise((r) => setTimeout(r, 50));
    }
}

async function main() {
    const a = await makeProvider('A');
    const b = await makeProvider('B');

    await waitFor(() => a.doc.getMap(ROOT).size > 0 || true, 'A synced', 8000);
    // give both clients a moment to sync their initial states
    await new Promise((r) => setTimeout(r, 1500));

    // Client A writes a new element
    const rootA = a.doc.getMap(ROOT);
    const elementsA = a.doc.getMap(ELEMENTS);
    if (rootA.size === 0) {
        rootA.set('type', 'form');
        rootA.set('title', 'Live sync test');
        rootA.set('id', documentName);
        rootA.set('uid', `live-${documentName}`);
        rootA.set('layout', 'VerticalLayout');
        rootA.set('children', new Y.Array<string>());
    }
    const elUid = `live-el-${Date.now()}`;
    const el = new Y.Map();
    el.set('uid', elUid);
    el.set('id', 'firstName');
    el.set('type', 'string');
    el.set('title', 'First Name');
    el.set('hidden', false);
    el.set('required', true);
    el.set('format', 'text');
    elementsA.set(elUid, el);
    (rootA.get('children') as Y.Array<string>).push([elUid]);
    console.log(`[A] wrote element ${elUid}`);

    // Client B must see it WITHOUT reload
    await waitFor(
        () => b.doc.getMap(ELEMENTS).has(elUid),
        'B to see element',
        10000
    );
    console.log(`[B] saw element ${elUid} without reload ✓`);

    // Also verify ordering propagates
    const childrenB = b.doc.getMap(ROOT).get('children') as Y.Array<string>;
    await waitFor(
        () => childrenB.toArray().includes(elUid),
        'B to see children order',
        5000
    );
    console.log('[B] children order propagated ✓');

    console.log('LIVE SYNC TEST PASSED');

    a.provider.destroy();
    b.provider.destroy();
    process.exit(0);
}

main().catch((e) => {
    console.error('LIVE SYNC TEST FAILED:', e);
    process.exit(1);
});
