import './load-env.js';
import 'reflect-metadata';
import * as Y from 'yjs';
import { Server } from '@hocuspocus/server';
import {
    AppDataSource,
    Form,
    User,
} from '@educorvi/vue-json-forms-builder-db-layer';
import {
    colorForUser,
    initializeEmptyDocument,
    type CollabUser,
} from '@educorvi/vue-json-form-builder-schemas/collab';
import { authenticateConnection, type ApiUser } from './auth.js';

const PORT = Number(process.env.COLLAB_PORT ?? 1234);

async function initDb(): Promise<void> {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('[collab] DataSource initialized');
    }
}

async function loadFormDocument(formId: number): Promise<Y.Doc> {
    const repo = AppDataSource.getRepository(Form);
    const form = await repo.findOne({
        where: { id: formId },
    });

    if (form?.yjs_state && form.yjs_state.length > 0) {
        try {
            const doc = new Y.Doc();
            Y.applyUpdate(doc, form.yjs_state);
            console.log(
                `[collab] load "${formId}": hydrated ${form.yjs_state.length} bytes of yjs state`
            );
            return doc;
        } catch (err) {
            console.error(
                `[collab] load "${formId}": invalid yjs state, starting empty:`,
                err instanceof Error ? err.message : err
            );
        }
    } else {
        console.log(
            `[collab] load "${formId}": no yjs state yet, starting empty`
        );
    }

    // No (valid) yjs state yet — still return an initialized document so
    // the root Form data exists for every client from the first sync on.
    const doc = new Y.Doc();
    initializeEmptyDocument(doc, {
        uid: `root-${formId}`,
        title: form?.title ?? 'My Form',
    });
    return doc;
}

/**
 * Persist the collab yjs state for a form, via the TypeORM repository for the `form` table.
 */
async function storeFormDocument(
    formId: number,
    document: Y.Doc,
    lastEditor?: ApiUser
): Promise<void> {
    const repo = AppDataSource.getRepository(Form);
    const state = Buffer.from(Y.encodeStateAsUpdate(document));

    let form = await repo.findOne({ where: { id: formId } });

    // updated_by / created_by are FK columns to the user table — assigning
    // an object with the primary key is enough for TypeORM to resolve the
    // relation on save.
    const actor = lastEditor ? ({ id: lastEditor.id } as User) : null;

    if (!form) {
        form = repo.create({
            id: formId,
            title: String(formId),
            name: String(formId),
            path: String(formId),
            yjs_state: state,
            created_by: actor,
            updated_by: actor,
        });
        await repo.save(form);
        console.log(
            `[collab] store "${formId}": created form row, saved ${state.length} bytes of yjs state`
        );
        return;
    }

    form.yjs_state = state;
    form.updated_by = actor;
    await repo.save(form);
    console.log(
        `[collab] store "${formId}": saved ${state.length} bytes of yjs state`
    );
}

async function main(): Promise<void> {
    await initDb();

    const server = new Server<{
        user: ApiUser;
        formId: number;
    }>({
        name: 'json-forms-builder-collab',
        port: PORT,
        debounce: 5000,
        maxDebounce: 20000,
        onAuthenticate: async ({ token, requestHeaders, documentName }) => {
            try {
                // Only numeric form ids are accepted as document names
                return await authenticateConnection(
                    token,
                    requestHeaders,
                    documentName
                );
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
                `[collab] connect: "${context.user.name}" (${context.user.id}) joined "${documentName}" → session "${context.formId}"`
            );
        },
        onDisconnect: async ({ documentName, context }) => {
            console.log(
                `[collab] disconnect: "${context.user.name}" (${context.user.id}) left "${documentName}" → session "${context.formId}"`
            );
        },
        beforeHandleAwareness: async ({ states, context }) => {
            if (!context?.user) return;
            const trustedUser: CollabUser = {
                id: context.user.id,
                name:
                    [context.user.firstName, context.user.lastName]
                        .filter(Boolean)
                        .join(' ') || context.user.name,
                color: colorForUser(context.user.id),
            };
            for (const state of states.values()) {
                if (state && typeof state === 'object') {
                    state.user = trustedUser;
                }
            }
        },
        onLoadDocument: async ({ context }) => loadFormDocument(context.formId),
        onStoreDocument: async ({ document, lastContext }) =>
            storeFormDocument(lastContext.formId, document, lastContext.user),
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
