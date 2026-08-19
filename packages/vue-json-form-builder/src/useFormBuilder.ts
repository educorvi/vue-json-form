import { inject, provide, ref, shallowRef, type Ref } from 'vue';
import * as Y from 'yjs';
import {
    FormDefinition,
    SchemaGenerator,
    fromJsonSchemaAndUiSchema,
    type FormElement,
} from '@educorvi/vue-json-form-builder-schemas';
import * as collab from '@educorvi/vue-json-form-builder-schemas/collab';
import type {
    CollabUser,
    RemotePresence,
} from '@educorvi/vue-json-form-builder-schemas/collab';
import {
    createPaletteElements,
    collectTakenIds,
    type PaletteElementType,
} from './types/paletteFields';

/**
 * Form builder engine — ONE mutation interface backed by a Y.Doc.
 *
 *   LOCAL  (collab: undefined) — a plain local Y.Doc. Every mutation goes
 *           through the collab adapter (schemas/collab/yjs-adapter.ts) and
 *           the reactive FormDefinition is rebuilt from the doc on every
 *           change — the exact same code path a synced document uses.
 *
 *   COLLAB (collab: { url, ... }) — a Y.Doc synced through Hocuspocus.
 *
 * Both modes share one engine: same mutations, same rebuild-on-update, same
 * generated artifacts. The only differences are the provider/awareness
 * wiring (presence, connection status) and the persistence owner (in collab
 * mode the Hocuspocus server persists the doc; in local mode the host app
 * saves via toJSON()/generateSchemas()).
 *
 * Usage: <VueJsonFormBuilder> creates the engine and `provide`s it;
 * child components call useFormBuilder().
 */

export interface CollabConfig {
    /** Hocuspocus server URL, e.g. "ws://localhost:1234" */
    url: string;
    /** Document name (= form id in the backend). */
    documentName: string;
    /**
     * Optional auth token for the collab server: an API key ("fb_...").
     * When omitted, the server authenticates the browser session by
     * forwarding the `nuxt-session` cookie from the WebSocket handshake to
     * the Nuxt backend for validation.
     */
    token?: string;
}

// Re-export the schemas' collab user type as the public builder API.
export type { CollabUser, RemotePresence };

/** A user with live presence — `online` reflects whether they are
 *  connected right now. Users that disconnect stay in the known list
 *  (marked offline) until the session ends. */
export interface KnownUser extends CollabUser {
    online: boolean;
}

export type CollabStatus =
    'local' | 'connecting' | 'connected' | 'disconnected';

/** Collab connection error reason (set when the server rejects the connection
 *  or is unreachable). */
export type CollabErrorReason =
    | 'unauthorized'
    | 'form-not-found'
    | 'forbidden'
    | 'permission-denied'
    | 'unreachable'
    | 'unknown';

export interface FormBuilder {
    readonly isCollab: boolean;
    readonly collabStatus: Ref<CollabStatus>;
    /**
     * Set when the collab server REJECTED the connection (form does not
     * exist / no edit access / unauthorized) — the form can not be loaded.
     * Null while connecting, connected or when no rejection happened.
     */
    readonly collabError: Ref<CollabErrorReason | null>;
    readonly formDefinition: Ref<FormDefinition | null>;
    readonly selectedElementId: Ref<string | null>;
    readonly connectedUsers: Ref<CollabUser[]>;
    /** All known users (self included) with live online/offline status. */
    readonly knownUsers: Ref<KnownUser[]>;
    /** Remote presence (user + selection + editing) of other clients. */
    readonly remotePresences: Ref<RemotePresence[]>;
    /** The local user (null in local mode) — rendered with OWN_USER_COLOR. */
    readonly currentUser: Ref<CollabUser | null>;

    selectElement(id: string | null): void;
    /** Announce which settings field the local user is editing. */
    setEditingField(elementUid: string | null, field: string | null): void;
    /**
     * (Re)connect the collab provider. No-op for the local engine and when
     * the provider already started. Used by auth-gated mounts: when the
     * builder waits for authentication (backendUrl / keycloak props),
     * connecting the websocket before the credentials exist would fail
     * authentication and the form would never load — so the component
     * defers the connection until auth completed and calls connect() then.
     *
     * `options` lets the caller supply the credentials that the login flow
     * produced (see useBuilderAuth): a bearer token for the websocket
     * (Keycloak access token or API key) and/or the authenticated user for
     * presence/awareness.
     */
    connect(options?: {
        token?: string;
        user?: { id: string; name: string; color?: string };
    }): void;
    /** Replace the whole form (plain definition object or instance). */
    loadDefinition(definition: object | FormDefinition): void;
    /** Import from a legacy {json, ui} schema pair (local mode only). */
    loadFromJsonUi(jsonSchema: unknown, uiSchema: unknown): void;
    addElement(
        containerUid: string,
        type: PaletteElementType,
        index?: number
    ): FormElement | undefined;
    moveElement(
        elementUid: string,
        targetContainerUid: string,
        index?: number
    ): void;
    deleteElement(elementUid: string): void;
    updateElementField(elementUid: string, field: string, value: unknown): void;
    /** Derive {jsonSchema, uiSchema} from the current form via SchemaGenerator. */
    generateSchemas(): { jsonSchema: object; uiSchema: object } | null;
    /** FormDefinition.toJSON() — the format persisted in the backend. */
    toJSON(): object | null;
    /** Tear down providers/doc (collab) — call on unmount. */
    dispose(): void;
}

const BUILDER_KEY = Symbol('vue-json-form-builder');

export function provideFormBuilder(builder: FormBuilder): void {
    provide(BUILDER_KEY, builder);
}

export function useFormBuilder(): FormBuilder {
    const builder = inject<FormBuilder>(BUILDER_KEY);
    if (!builder) {
        throw new Error(
            'useFormBuilder(): no form builder provided. Mount <VueJsonFormBuilder> first.'
        );
    }
    return builder;
}

/**
 * Create a builder engine. Pass `collab` to enable realtime collaboration.
 *
 * `options.autoConnect` (default true) controls whether the collab provider
 * connects immediately. Auth-gated hosts (backendUrl prop) pass false and
 * call `builder.connect()` once the session exists — connecting before
 * login would send an unauthenticated websocket handshake and the server
 * would reject it, leaving the form empty forever.
 */
export function createFormBuilder(
    collab?: CollabConfig | null,
    options?: { autoConnect?: boolean }
): FormBuilder {
    return collab
        ? createCollabBuilder(collab, options?.autoConnect !== false)
        : createLocalBuilder();
}

// ─── Shared engine core (local Y.Doc ↔ collab Y.Doc) ─────────────────────────

function createEngine(
    doc: Y.Doc,
    refs: {
        formDefinition: Ref<FormDefinition | null>;
        selectedElementId: Ref<string | null>;
    }
): Pick<
    FormBuilder,
    | 'formDefinition'
    | 'selectedElementId'
    | 'addElement'
    | 'moveElement'
    | 'deleteElement'
    | 'updateElementField'
    | 'generateSchemas'
    | 'toJSON'
    | 'loadDefinition'
    | 'loadFromJsonUi'
> {
    const { formDefinition, selectedElementId } = refs;

    /** Rebuild the reactive FormDefinition projection from the Y.Doc. */
    function rebuild(): void {
        try {
            formDefinition.value = collab.yDocToFormDefinition(doc);
        } catch (err) {
            console.error(
                '[builder] failed to rebuild FormDefinition from doc:',
                err
            );
        }
    }

    // The Y.Doc is the single source of truth — every change (local or
    // remote) re-projects it into a reactive FormDefinition.
    doc.on('update', rebuild);

    return {
        formDefinition,
        selectedElementId,

        loadDefinition(definition) {
            const fd =
                definition instanceof FormDefinition
                    ? definition
                    : FormDefinition.fromJSON(JSON.stringify(definition));
            collab.hydrateDocument(doc, fd); // fires 'update' → rebuild
        },

        loadFromJsonUi(jsonSchema, uiSchema) {
            const imported = fromJsonSchemaAndUiSchema(
                jsonSchema as Parameters<typeof fromJsonSchemaAndUiSchema>[0],
                uiSchema as Parameters<typeof fromJsonSchemaAndUiSchema>[1]
            );
            collab.hydrateDocument(doc, imported);
        },

        addElement(containerUid, type, index) {
            const fd = formDefinition.value;
            const elements = createPaletteElements(
                type,
                fd ? collectTakenIds(fd) : undefined
            );
            collab.addElements(doc, containerUid, elements, index);
            return elements[0];
        },

        moveElement(elementUid, targetContainerUid, index) {
            collab.moveElement(doc, elementUid, targetContainerUid, index ?? 0);
        },

        deleteElement(elementUid) {
            collab.deleteElement(doc, elementUid);
            if (selectedElementId.value === elementUid) {
                selectedElementId.value = null;
            }
        },

        updateElementField(elementUid, field, value) {
            collab.updateElementField(doc, elementUid, field, value);
        },

        generateSchemas() {
            const current = formDefinition.value;
            if (!current) return null;
            return new SchemaGenerator(current).generateFullSchema();
        },

        toJSON() {
            return formDefinition.value?.toJSON() ?? null;
        },
    };
}

// ─── LOCAL engine (plain Y.Doc, no provider) ─────────────────────────────────

function createLocalBuilder(): FormBuilder {
    const doc = new Y.Doc();
    const collabStatus = ref<CollabStatus>('local');
    // Local mode never talks to a collab server — no rejection possible.
    const collabError = ref<CollabErrorReason | null>(null);
    const connectedUsers = ref<CollabUser[]>([]);
    const remotePresences = ref<RemotePresence[]>([]);
    const currentUser = ref<CollabUser | null>(null);
    const knownUsers = ref<KnownUser[]>([]);
    const formDefinition = shallowRef<FormDefinition | null>(null);
    const selectedElementId = ref<string | null>(null);

    // publish the initial (empty) form so the canvas renders without props
    collab.initializeEmptyDocument(doc, { id: 'form', title: 'My Form' });

    const engine = createEngine(doc, { formDefinition, selectedElementId });
    formDefinition.value = collab.yDocToFormDefinition(doc);

    return {
        isCollab: false,
        collabStatus,
        collabError,
        connectedUsers,
        knownUsers,
        remotePresences,
        currentUser,
        ...engine,

        selectElement(id) {
            selectedElementId.value = id;
        },

        setEditingField() {
            // no presence in local mode
        },

        connect() {
            // no provider in local mode
        },

        dispose() {
            doc.destroy();
        },
    };
}

// ─── COLLAB engine (Yjs + Hocuspocus) ─────────────────────────────────────────

function createCollabBuilder(
    collabConfig: CollabConfig,
    autoConnect: boolean
): FormBuilder {
    const collabStatus = ref<CollabStatus>('connecting');
    const collabError = ref<CollabErrorReason | null>(null);
    const connectedUsers = ref<CollabUser[]>([]);
    const remotePresences = ref<RemotePresence[]>([]);
    const currentUser = ref<CollabUser | null>(null);
    const knownUsers = ref<KnownUser[]>([]);
    const formDefinition = shallowRef<FormDefinition | null>(null);
    const selectedElementId = ref<string | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provider: any = null;
    let doc: Y.Doc | null = null;
    let disposed = false;
    /** true once init() has run — connect() must be idempotent */
    let started = false;
    /** true once the websocket has connected at least once */
    let everConnected = false;

    /** The engine core is created lazily once the provider document exists
     *  (HocuspocusProvider creates it synchronously in the constructor). */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeEngine: any = null;

    /** Merge awareness users into the known list, flagging online/offline.
     *  Users that leave the awareness (disconnect) stay listed as offline.
     *  In the future, the backend should track which users were viewing the document when so we can easily show a history of every user when the document was edited.
     * */
    function refreshKnownUsers() {
        if (!provider?.awareness) return;
        const current = collab.getConnectedUsers(provider.awareness);
        const currentIds = new Set(current.map((u: CollabUser) => u.id));
        const merged = knownUsers.value.map((k) => ({
            ...k,
            online: currentIds.has(k.id),
        }));
        for (const user of current) {
            if (!merged.some((k) => k.id === user.id)) {
                merged.push({ ...user, online: true });
            }
        }
        knownUsers.value = merged;
    }

    async function init(connectOptions?: {
        token?: string;
        user?: { id: string; name: string; color?: string };
    }): Promise<void> {
        if (disposed || started) return;
        started = true;
        const { HocuspocusProvider } = await import('@hocuspocus/provider');
        if (disposed) return;

        // A new connection attempt clears any previous rejection.
        collabError.value = null;

        provider = new HocuspocusProvider({
            url: collabConfig.url,
            name: collabConfig.documentName,
            token: connectOptions?.token ?? collabConfig.token,
            onAuthenticationFailed: ({ reason }: { reason: string }) => {
                // The server rejected the handshake (see collab-server/auth.ts
                // — ConnectionAuthError reasons). The form can not be loaded.
                collabError.value =
                    reason in
                    {
                        unauthorized: 1,
                        'form-not-found': 1,
                        forbidden: 1,
                        'permission-denied': 1,
                    }
                        ? (reason as CollabErrorReason)
                        : 'unknown';
            },
            onAwarenessChange: () => {
                if (provider?.awareness) {
                    connectedUsers.value = collab.getConnectedUsers(
                        provider.awareness
                    );
                    remotePresences.value = collab.getRemotePresences(
                        provider.awareness
                    );
                    refreshKnownUsers();
                }
            },
            onStatus: ({ status }: { status: CollabStatus }) => {
                collabStatus.value = status;
                if (status === 'connected') {
                    everConnected = true;
                    // A retry succeeded — the error (if any) is stale.
                    collabError.value = null;
                } else if (
                    status === 'disconnected' &&
                    !everConnected &&
                    !disposed
                ) {
                    // The first connection never succeeded — the collab
                    // server is not reachable (down, wrong URL, network
                    // blocked). The provider keeps retrying in the
                    // background; show the error so the user isn't left
                    // staring at an empty form.
                    collabError.value = 'unreachable';
                }
                // connection loss can change who is online without an
                // awareness event — recompute on every status change too
                refreshKnownUsers();
            },
        });
        const providerDoc: Y.Doc = provider.document;
        doc = providerDoc;

        activeEngine = createEngine(providerDoc, {
            formDefinition,
            selectedElementId,
        });

        // An empty document produces no `update` events — build the (empty)
        // FormDefinition right after the initial sync so the canvas renders.
        provider.on('synced', ({ state }: { state: boolean }) => {
            if (!state || disposed || !doc || !activeEngine) return;
            if (activeEngine.formDefinition.value) return;
            try {
                activeEngine.formDefinition.value =
                    collab.yDocToFormDefinition(doc);
            } catch (err) {
                console.error(
                    '[collab] failed to build FormDefinition on sync:',
                    err
                );
            }
        });

        const user = connectOptions?.user;
        if (user) {
            // Remote clients see the user in their assigned palette color
            // (never the reserved primary — see OWN_USER_COLOR in the
            // schemas awareness module); the local UI renders the user's
            // own avatar in primary instead (UserAvatarStack selfId).
            const collabUser = {
                id: user.id,
                name: user.name,
                color: user.color ?? collab.colorForUser(user.id),
            };
            currentUser.value = collabUser;
            provider.on('connect', () => {
                collab.setPresenceUser(provider.awareness, collabUser);
                // re-broadcast selection/editing once (re)connected
                collab.setSelectedElement(
                    provider.awareness,
                    activeEngine?.selectedElementId.value ?? null
                );
            });
        }
    }
    if (autoConnect) void init();

    return {
        isCollab: true,
        collabStatus,
        collabError,
        formDefinition,
        selectedElementId,
        connectedUsers,
        knownUsers,
        remotePresences,
        currentUser,

        selectElement(id) {
            if (activeEngine) activeEngine.selectedElementId.value = id;
            collab.setSelectedElement?.(provider?.awareness, id);
        },

        setEditingField(elementUid, field) {
            collab.setEditingField?.(provider?.awareness, elementUid, field);
        },

        connect(options?: {
            token?: string;
            user?: { id: string; name: string; color?: string };
        }) {
            void init(options);
        },

        // The server (and thus the Y.Doc) is the source of truth in collab
        // mode — loading a definition here would fight the synced document,
        // so it is intentionally a no-op (log only).
        loadDefinition() {
            console.warn(
                '[collab] loadDefinition ignored — the synced document is the source of truth.'
            );
        },

        loadFromJsonUi() {
            console.warn(
                '[collab] loadFromJsonUi ignored — the synced document is the source of truth.'
            );
        },

        addElement(containerUid, type, index) {
            if (!doc) return undefined;
            const fd = activeEngine?.formDefinition.value;
            const elements = createPaletteElements(
                type,
                fd ? collectTakenIds(fd) : undefined
            );
            collab.addElements(doc, containerUid, elements, index);
            return elements[0];
        },

        moveElement(elementUid, targetContainerUid, index) {
            if (doc)
                collab.moveElement(
                    doc,
                    elementUid,
                    targetContainerUid,
                    index ?? 0
                );
        },

        deleteElement(elementUid) {
            if (doc) collab.deleteElement(doc, elementUid);
            if (activeEngine?.selectedElementId.value === elementUid) {
                activeEngine.selectedElementId.value = null;
            }
        },

        updateElementField(elementUid, field, value) {
            if (doc) collab.updateElementField(doc, elementUid, field, value);
        },

        generateSchemas() {
            const current = activeEngine?.formDefinition.value ?? null;
            if (!current) return null;
            return new SchemaGenerator(current).generateFullSchema();
        },

        toJSON() {
            return activeEngine?.formDefinition.value?.toJSON() ?? null;
        },

        dispose() {
            disposed = true;
            provider?.destroy();
            doc?.destroy();
        },
    };
}
