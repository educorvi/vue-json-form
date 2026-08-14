import { inject, provide, ref, shallowRef, type Ref } from 'vue';
import {
    Form,
    FormDefinition,
    SchemaGenerator,
    fromJsonSchemaAndUiSchema,
    type ContainerElement,
    type FormElement,
} from '@educorvi/vue-json-form-builder-schemas';
import {
    createPaletteElements,
    collectTakenIds,
    type PaletteElementType,
} from './types/paletteFields';
// Type-only imports from the collab entry — erased at compile time, so yjs
// never ends up in the local-mode bundle.
import type {
    CollabUser,
    RemotePresence,
} from '@educorvi/vue-json-form-builder-schemas/collab';

/**
 * Form builder engine — the single source of truth for the builder UI.
 *
 * Two interchangeable engines:
 *
 *   LOCAL  (default, collab: undefined)  — a plain FormDefinition instance,
 *           mutated directly. yjs is never loaded at runtime.
 *
 *   COLLAB (collab: { url, ... })        — a Y.Doc synced through Hocuspocus.
 *           All mutations go through the yjs adapter (schemas/collab), the
 *           reactive FormDefinition is rebuilt from the doc on every change.
 *
 * Both engines expose the same mutation API, so components never know which
 * engine is active.
 *
 * Usage: <VueJsonFormBuilder> creates the engine and `provide`s it;
 * child components call useFormBuilder().
 */

export interface CollabConfig {
    /** Hocuspocus server URL, e.g. "ws://localhost:1234" */
    url: string;
    /** Document name (= form id in the backend). Defaults to "default-form". */
    documentName?: string;
    /**
     * Optional auth token for the collab server: an API key ("fb_...").
     * When omitted, the server authenticates the browser session by
     * forwarding the `nuxt-session` cookie from the WebSocket handshake to
     * the Nuxt backend for validation.
     */
    token?: string;
    /** Current user, broadcast to other clients via awareness. */
    user?: { id: string; name: string; color?: string };
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

export interface FormBuilder {
    readonly isCollab: boolean;
    readonly collabStatus: Ref<CollabStatus>;
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
     * builder waits for a backend login (backendUrl prop), connecting the
     * websocket before the session exists would fail authentication and
     * the form would never load — so the component defers the connection
     * until the login completed and calls connect() then.
     *
     * `options` lets the caller supply the credentials that the login flow
     * produced (see useBackendAuth): a bearer token for the websocket
     * (Keycloak access token or API key) and/or the authenticated user for
     * presence/awareness. They take precedence over the values from the
     * static CollabConfig.
     */
    connect(options?: { token?: string; user?: CollabConfig['user'] }): void;
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

// ─── LOCAL engine (no yjs) ────────────────────────────────────────────────────

function createLocalBuilder(): FormBuilder {
    const formDefinition = shallowRef<FormDefinition | null>(null);
    const selectedElementId = ref<string | null>(null);
    const collabStatus = ref<CollabStatus>('local');
    const connectedUsers = ref<CollabUser[]>([]);
    const remotePresences = ref<RemotePresence[]>([]);
    const currentUser = ref<CollabUser | null>(null);
    const knownUsers = ref<KnownUser[]>([]);

    let fd: FormDefinition = new FormDefinition(
        new Form({ id: 'form', title: 'My Form' })
    );

    /** Replace the ref with a re-indexed instance so shallowRef consumers re-render. */
    function commit(): void {
        fd = new FormDefinition(
            fd.root,
            [...fd.nodesIndex.values()],
            [...fd.dependencyIndex.values()]
        );
        formDefinition.value = fd;
    }

    // publish the initial (empty) form so the canvas renders without props
    commit();

    return {
        isCollab: false,
        collabStatus,
        formDefinition,
        selectedElementId,
        connectedUsers,
        knownUsers,
        remotePresences,
        currentUser,

        selectElement(id) {
            selectedElementId.value = id;
        },

        setEditingField() {
            // no presence in local mode
        },

        loadDefinition(definition) {
            fd =
                definition instanceof FormDefinition
                    ? definition
                    : FormDefinition.fromJSON(JSON.stringify(definition));
            commit();
        },

        loadFromJsonUi(jsonSchema, uiSchema) {
            const imported = fromJsonSchemaAndUiSchema(
                jsonSchema as Parameters<typeof fromJsonSchemaAndUiSchema>[0],
                uiSchema as Parameters<typeof fromJsonSchemaAndUiSchema>[1]
            );
            fd = imported;
            commit();
        },

        addElement(containerUid, type, index) {
            const container =
                containerUid === fd.root.uid
                    ? fd.root
                    : fd.getElementById(containerUid);
            if (!container)
                throw new Error(`Container "${containerUid}" not found`);
            const containerEl = container as ContainerElement | Form;
            const elements = createPaletteElements(type, collectTakenIds(fd));
            const element = elements[0];
            // index any companion elements (e.g. the buttons of a
            // button-group) BEFORE inserting, so the parent-index walk in
            // insertElement finds them
            for (const extra of elements.slice(1)) {
                fd.nodesIndex.set(extra.uid, extra);
                fd.parentIndex.set(extra.uid, element.uid);
            }
            fd.insertElement(
                element,
                containerEl,
                index ?? containerEl.children.length
            );
            commit();
            return element;
        },

        moveElement(elementUid, targetContainerUid, index) {
            const target =
                targetContainerUid === fd.root.uid
                    ? fd.root
                    : fd.getElementById(targetContainerUid);
            if (!target)
                throw new Error(`Container "${targetContainerUid}" not found`);
            fd.moveElement(
                elementUid,
                target as ContainerElement | Form,
                index ?? 0
            );
            commit();
        },

        deleteElement(elementUid) {
            fd.deleteElement(elementUid);
            if (selectedElementId.value === elementUid)
                selectedElementId.value = null;
            commit();
        },

        updateElementField(elementUid, field, value) {
            const element =
                elementUid === fd.root.uid
                    ? fd.root
                    : fd.getElementById(elementUid);
            if (!element) throw new Error(`Element "${elementUid}" not found`);
            fd.updateElement(element, { [field]: value } as Partial<
                FormElement['data']
            >);
            commit();
        },

        generateSchemas() {
            // read the reactive ref so computed() consumers re-evaluate
            const current = formDefinition.value ?? fd;
            const generator = new SchemaGenerator(current);
            return {
                jsonSchema: current.root.toJsonSchema(generator, [
                    'properties',
                ]),
                uiSchema: current.root.toUiSchema(generator),
            };
        },

        toJSON() {
            return (formDefinition.value ?? fd).toJSON();
        },

        connect(_options?: { token?: string; user?: CollabConfig['user'] }) {
            // no provider in local mode
        },

        dispose() {
            // nothing to tear down in local mode
        },
    };
}

// ─── COLLAB engine (Yjs + Hocuspocus) ─────────────────────────────────────────

function createCollabBuilder(
    collab: CollabConfig,
    autoConnect: boolean
): FormBuilder {
    const formDefinition = shallowRef<FormDefinition | null>(null);
    const selectedElementId = ref<string | null>(null);
    const collabStatus = ref<CollabStatus>('connecting');
    const connectedUsers = ref<CollabUser[]>([]);
    const remotePresences = ref<RemotePresence[]>([]);
    const currentUser = ref<CollabUser | null>(null);
    const knownUsers = ref<KnownUser[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let adapter: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let provider: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let doc: any = null;
    let fdRef: FormDefinition | null = null;
    let updateTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    /** true once init() has run — connect() must be idempotent */
    let started = false;

    /** Merge awareness users into the known list, flagging online/offline.
     *  Users that leave the awareness (disconnect) stay listed as offline.
     *  In the future, the backend should track which users were viewing the document when so we can easily show a history of every user when the document was edited.
     * */
    function refreshKnownUsers() {
        if (!adapter || !provider?.awareness) return;
        const current = adapter.getConnectedUsers(provider.awareness);
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
        user?: CollabConfig['user'];
    }): Promise<void> {
        if (disposed || started) return;
        started = true;
        const mod =
            await import('@educorvi/vue-json-form-builder-schemas/collab');
        const { HocuspocusProvider } = await import('@hocuspocus/provider');
        if (disposed) return;
        adapter = mod;

        provider = new HocuspocusProvider({
            url: collab.url,
            name: collab.documentName ?? 'default-form',
            token: connectOptions?.token ?? collab.token,
            onAwarenessChange: () => {
                if (provider?.awareness) {
                    connectedUsers.value = mod.getConnectedUsers(
                        provider.awareness
                    );
                    remotePresences.value = mod.getRemotePresences(
                        provider.awareness
                    );
                    refreshKnownUsers();
                }
            },
            onStatus: ({ status }: { status: CollabStatus }) => {
                collabStatus.value = status;
                // connection loss can change who is online without an
                // awareness event — recompute on every status change too
                refreshKnownUsers();
            },
        });
        doc = provider.document;

        // The Y.Doc is the source of truth — every change (local or remote)
        // rebuilds the reactive FormDefinition (debounced).
        doc.on('update', () => {
            if (updateTimer) clearTimeout(updateTimer);
            updateTimer = setTimeout(() => {
                if (disposed || !doc) return;
                try {
                    fdRef = mod.yDocToFormDefinition(doc);
                    formDefinition.value = fdRef;
                } catch (err) {
                    console.error(
                        '[collab] failed to rebuild FormDefinition from doc:',
                        err
                    );
                }
            }, 100);
        });

        // An empty document produces no `update` events — build the (empty)
        // FormDefinition right after the initial sync so the canvas renders.
        provider.on('synced', ({ state }: { state: boolean }) => {
            if (!state || disposed || !doc || formDefinition.value) return;
            try {
                fdRef = mod.yDocToFormDefinition(doc);
                formDefinition.value = fdRef;
            } catch (err) {
                console.error(
                    '[collab] failed to build FormDefinition on sync:',
                    err
                );
            }
        });

        const user = connectOptions?.user ?? collab.user;
        if (user) {
            // Remote clients see the user in their assigned palette color
            // (never the reserved primary — see OWN_USER_COLOR in the
            // schemas awareness module); the local UI renders the user's
            // own avatar in primary instead (UserAvatarStack selfId).
            const collabUser = {
                id: user.id,
                name: user.name,
                color: user.color ?? mod.colorForUser(user.id),
            };
            currentUser.value = collabUser;
            provider.on('connect', () => {
                mod.setPresenceUser(provider.awareness, collabUser);
                // re-broadcast selection/editing once (re)connected
                mod.setSelectedElement(
                    provider.awareness,
                    selectedElementId.value
                );
            });
        }
    }
    if (autoConnect) void init();

    return {
        isCollab: true,
        collabStatus,
        formDefinition,
        selectedElementId,
        connectedUsers,
        knownUsers,
        remotePresences,
        currentUser,

        selectElement(id) {
            selectedElementId.value = id;
            adapter?.setSelectedElement?.(provider?.awareness, id);
        },

        setEditingField(elementUid, field) {
            adapter?.setEditingField?.(provider?.awareness, elementUid, field);
        },

        connect(options?: { token?: string; user?: CollabConfig['user'] }) {
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
            const elements = createPaletteElements(
                type,
                fdRef ? collectTakenIds(fdRef) : undefined
            );
            adapter?.addElements(doc, containerUid, elements, index);
            return elements[0];
        },

        moveElement(elementUid, targetContainerUid, index) {
            adapter?.moveElement(doc, elementUid, targetContainerUid, index);
        },

        deleteElement(elementUid) {
            adapter?.deleteElement(doc, elementUid);
            if (selectedElementId.value === elementUid) {
                this.selectElement(null);
            }
        },

        updateElementField(elementUid, field, value) {
            adapter?.updateElementField(doc, elementUid, field, value);
        },

        generateSchemas() {
            const current = fdRef ?? formDefinition.value;
            if (!current) return null;
            const generator = new SchemaGenerator(current);
            return {
                jsonSchema: current.root.toJsonSchema(generator, [
                    'properties',
                ]),
                uiSchema: current.root.toUiSchema(generator),
            };
        },

        toJSON() {
            return (fdRef ?? formDefinition.value)?.toJSON() ?? null;
        },

        dispose() {
            disposed = true;
            if (updateTimer) clearTimeout(updateTimer);
            provider?.destroy();
            doc?.destroy();
        },
    };
}
