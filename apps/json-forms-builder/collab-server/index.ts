import './load-env';
import 'reflect-metadata';
import * as Y from 'yjs';
import { Server } from '@hocuspocus/server';
import { AppDataSource } from '../server/db/data-source';
import { Form } from '../server/db/entities/Form';
import {
    colorForUser,
    initializeEmptyDocument,
    type CollabUser,
} from '@educorvi/vue-json-form-builder-schemas/collab';
import { authenticateConnection, type WsAuthUser } from './auth';

const PORT = Number(process.env.COLLAB_PORT ?? 1234);

async function initDb(): Promise<void> {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('[collab] DataSource initialized');
    }
}

async function loadFormDocument(documentName: string): Promise<Y.Doc> {
    const repo = AppDataSource.getRepository(Form);
    const form = await repo.findOne({
        where: { id: Number(documentName) },
    });

    if (form?.yjs_state && form.yjs_state.length > 0) {
        try {
            const doc = new Y.Doc();
            Y.applyUpdate(doc, form.yjs_state);
            console.log(
                `[collab] load "${documentName}": hydrated ${form.yjs_state.length} bytes of yjs state`
            );
            return doc;
        } catch (err) {
            console.error(
                `[collab] load "${documentName}": invalid yjs state, starting empty:`,
                err instanceof Error ? err.message : err
            );
        }
    } else {
        console.log(
            `[collab] load "${documentName}": no yjs state yet, starting empty`
        );
    }

    const doc = new Y.Doc();
    initializeEmptyDocument(doc, {
        uid: `root-${documentName}`,
        title: form?.title ?? 'My Form',
    });
    return doc;
}

async function storeFormDocument(
    documentName: string,
    document: Y.Doc
): Promise<void> {
    const repo = AppDataSource.getRepository(Form);
    let form = await repo.findOne({ where: { id: Number(documentName) } });

    const state = Buffer.from(Y.encodeStateAsUpdate(document));

    if (!form) {
        // Create a minimal form row so the yjs state is persisted even
        // when the form was never created through the oRPC API. Use a raw
        // INSERT so the documentName (= form id) is preserved — repo.create()
        // would assign a new auto-increment id and break future loads.
        await repo.query(
            `INSERT INTO "form" ("id", "title", "name", "path", "yjs_state")
             VALUES ($1::int, $1::text, $1::text, $1::text, $2::bytea)
             ON CONFLICT ("id") DO UPDATE SET "yjs_state" = $2::bytea`,
            [Number(documentName), state]
        );
    } else {
        form.yjs_state = state;
        await repo.save(form);
    }
    console.log(
        `[collab] store "${documentName}": saved ${state.length} bytes of yjs state`
    );
}

async function main(): Promise<void> {
    await initDb();

    const server = new Server<{ user: WsAuthUser }>({
        name: 'json-forms-builder-collab',
        port: PORT,
        debounce: 5000,
        maxDebounce: 20000,
        onAuthenticate: async ({ token, requestHeaders, documentName }) => {
            try {
                return {
                    user: await authenticateConnection(
                        token,
                        requestHeaders,
                        documentName
                    ),
                };
            } catch (err) {
                console.warn(
                    `[collab] auth rejected for "${documentName}" (token "${token?.slice(0, 16)}…"): ${
                        err instanceof Error ? err.message : err
                    }`
                );
                throw err;
            }
        },
        connected: async ({ documentName, context }) => {
            console.log(
                `[collab] connect: "${context.user.username}" (${context.user.id}) joined "${documentName}"`
            );
        },
        onDisconnect: async ({ documentName, context }) => {
            console.log(
                `[collab] disconnect: "${context.user.username}" (${context.user.id}) left "${documentName}"`
            );
        },
        beforeHandleAwareness: async ({ states, context }) => {
            if (!context?.user) return;
            const trustedUser: CollabUser = {
                id: context.user.id,
                name:
                    [context.user.firstName, context.user.lastName]
                        .filter(Boolean)
                        .join(' ') || context.user.username,
                color: colorForUser(context.user.id),
            };
            for (const state of states.values()) {
                if (state && typeof state === 'object') {
                    state.user = trustedUser;
                }
            }
        },
        onLoadDocument: async ({ documentName }) =>
            loadFormDocument(documentName),
        onStoreDocument: async ({ documentName, document }) =>
            storeFormDocument(documentName, document),
    });

    server.listen().then(() => {
        console.log(
            `[collab] Hocuspocus server listening on ws://localhost:${PORT}`
        );
    });
}

main().catch((err) => {
    console.error('[collab] failed to start:', err);
    process.exit(1);
});
