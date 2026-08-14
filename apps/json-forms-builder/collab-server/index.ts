/**
 * Hocuspocus realtime collaboration server.
 *
 * Standalone process — run with `yarn dev:collab` in apps/json-forms-builder.
 *
 * Responsibilities:
 *   - one Yjs document per form (documentName = form id)
 *   - onLoadDocument: hydrate the Y.Doc from the form's `definition` jsonb
 *     column (FormDefinition.toJSON()). Legacy `schema` ({json, ui}) is
 *     intentionally NOT loaded — those forms open as empty docs until they
 *     are saved in the new builder.
 *   - onStoreDocument: persist the document back into `definition`
 *     (debounced by Hocuspocus while clients are connected, immediately on
 *     disconnect).
 *   - onAuthenticate: only authenticated connections are allowed — the
 *     handshake's session cookie or API key is forwarded to the Nuxt
 *     backend (GET /api/ws-auth) for validation. See collab-server/auth.ts.
 *   - presence (awareness) is passed through between clients by Hocuspocus
 *     itself — no extra server state needed, it is purely temporary.
 */
import './load-env';
import 'reflect-metadata';
import * as Y from 'yjs';
import { Server } from '@hocuspocus/server';
import { AppDataSource } from '../server/db/data-source';
import { Form } from '../server/db/entities/Form';
import {
    FormDefinition,
    fromJSON,
} from '@educorvi/vue-json-form-builder-schemas';
import {
    formDefinitionToYDoc,
    initializeEmptyDocument,
    yDocToFormDefinition,
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

    if (form?.definition) {
        try {
            const formDefinition: FormDefinition = fromJSON(
                JSON.stringify(form.definition)
            );
            console.log(
                `[collab] load "${documentName}": hydrated ${formDefinition.nodesIndex.size} elements from definition`
            );
            return formDefinitionToYDoc(formDefinition);
        } catch (err) {
            console.error(
                `[collab] load "${documentName}": invalid definition, starting empty:`,
                err instanceof Error ? err.message : err
            );
        }
    } else {
        console.log(
            `[collab] load "${documentName}": no definition yet, starting empty`
        );
    }

    // No (valid) definition yet — still return an initialized document so
    // the root Form data exists for every client from the first sync on.
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

    // yDocToFormDefinition throws on corrupted documents — let it crash the
    // store hook so the error surfaces in the logs.
    const definition = yDocToFormDefinition(document).toJSON();

    if (!form) {
        // Create a minimal form row so the definition is persisted even
        // when the form was never created through the oRPC API. Use a raw
        // INSERT so the documentName (= form id) is preserved — repo.create()
        // would assign a new auto-increment id and break future loads.
        await repo.query(
            `INSERT INTO "form" ("id", "title", "name", "path", "schema", "definition")
             VALUES ($1::int, $1::text, $1::text, $1::text, NULL, $2::jsonb)
             ON CONFLICT ("id") DO UPDATE SET "definition" = $2::jsonb`,
            [Number(documentName), JSON.stringify(definition)]
        );
    } else {
        form.definition = definition as Record<string, unknown>;
        await repo.save(form);
    }
    console.log(
        `[collab] store "${documentName}": saved ${
            Object.keys(
                (definition as { elements?: Record<string, unknown> })
                    .elements ?? {}
            ).length
        } elements`
    );
}

async function main(): Promise<void> {
    await initDb();

    const server = new Server<{ user: WsAuthUser }>({
        name: 'json-forms-builder-collab',
        port: PORT,
        // persist ~5s after the last change while clients are connected,
        // and once more immediately when the last client disconnects.
        debounce: 5000,
        maxDebounce: 20000,
        onAuthenticate: async ({ token, requestHeaders }) => {
            // Throwing here rejects the WebSocket connection.
            try {
                return {
                    user: await authenticateConnection(token, requestHeaders),
                };
            } catch (err) {
                console.warn(
                    `[collab] auth rejected (token "${token?.slice(0, 16)}…"): ${
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
