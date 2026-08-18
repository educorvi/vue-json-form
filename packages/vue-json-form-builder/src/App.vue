<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed, type Ref } from 'vue';
import { PhPencilSimple, PhCaretRight } from '@phosphor-icons/vue';
import { BAlert } from 'bootstrap-vue-next';
import { supportedUiSchemaVersion, version } from '@educorvi/vue-json-form';
import {
    createFormBuilder,
    provideFormBuilder,
    type CollabConfig,
    type CollabErrorReason,
} from './useFormBuilder';
import { useUiState } from './useUiState';
import {
    useBuilderAuth,
    type KeycloakAuthConfig,
} from '@/composables/useBuilderAuth';
import AuthGate from './components/AuthGate.vue';
import LeftPanel from './components/LeftPanel/LeftPanel.vue';
import MiddlePanel from './components/MiddlePanel/MiddlePanel.vue';
import RightPanel from './components/RightPanel/RightPanel.vue';

/**
 *
 * Props:
 *   jsonSchema / uiSchema — optional initial {json, ui} schema pair (imported
 *                           once through fromJsonSchemaAndUiSchema). Ignored
 *                           when `collab` is enabled (the synced document is
 *                           the source of truth).
 *   collab               — enable realtime collaboration via Hocuspocus:
 *                           { url, documentName?, user? }. When absent the
 *                           builder runs fully local without yjs.
 *   hideHeader           — hide the top toolbar.
 *   keycloak             — Keycloak login via keycloak-js (PUBLIC client,
 *                           PKCE): { url, realm, clientId, idpHint?, … } — see
 *                           KeycloakAuthConfig in composables/useBuilderAuth.ts.
 *                           Used when the builder/webcomponent runs embedded in
 *                           a third-party host. Silent `check-sso` on mount;
 *                           the access token authenticates the collab
 *                           websocket.
 *   backendUrl           — fallback: base URL of a hosting backend (a Nuxt app
 *                           using nuxt-auth-utils). The builder checks the
 *                           session (`GET <backendUrl>/api/_auth/session`); the
 *                           session cookie authenticates the collab websocket.
 *   keycloakIdpHint      — Keycloak `kc_idp_hint` appended to the backend's
 *                           login URL (session mode only).
 *
 * Without `keycloak` and `backendUrl` the builder runs fully LOCAL: no
 * authentication, no backend communication (see useBuilderAuth).
 *
 * Emits:
 *   vjfb-change            — {jsonSchema, uiSchema} derived via SchemaGenerator
 *   vjfb-definition-change — FormDefinition.toJSON() (the persisted format)
 */
const props = withDefaults(
    defineProps<{
        jsonSchema?: string;
        uiSchema?: string;
        hideHeader?: boolean;
        collab?: CollabConfig | null;
        keycloak?: KeycloakAuthConfig | null;
        backendUrl?: string;
        keycloakIdpHint?: string;
    }>(),
    {
        hideHeader: false,
        collab: null,
        keycloak: null,
        jsonSchema: undefined,
        uiSchema: undefined,
        backendUrl: undefined,
        keycloakIdpHint: undefined,
    }
);

const emit = defineEmits<{
    'vjfb-change': [jsonSchema: object, uiSchema: object];
    'vjfb-definition-change': [definition: object];
}>();

// When auth is configured (backendUrl / keycloak), the collab websocket
// must NOT connect before the credentials exist (the handshake would be
// unauthenticated and the server would reject it — the form would stay
// empty). The provider is therefore created lazily and connected by
// onAuthenticated() once auth completed. Without auth props the builder
// runs local and connects immediately.
const builder = createFormBuilder(props.collab, {
    autoConnect: !props.backendUrl && !props.keycloak,
});
provideFormBuilder(builder);
const { themeMode } = useUiState();

// ── Authentication (keycloak-js / backend session / local) ────────────────
// Delegated to useBuilderAuth (src/composables/useBuilderAuth.ts): keycloak
// mode does a silent `check-sso` and provides a Keycloak access token for
// the collab websocket; session mode checks the backend session cookie;
// local mode does nothing. onAuthenticated() connects the collab websocket
// with the produced credentials — it must not connect before that.
const {
    mode: authMode,
    checkingAuth,
    loginRequired,
    authError,
    checkAuth,
    login,
} = useBuilderAuth({
    backendUrl: computed(() => props.backendUrl),
    keycloakIdpHint: computed(() => props.keycloakIdpHint),
    keycloak: computed(() => props.keycloak ?? undefined),
    onAuthenticated: ({ token, user }) =>
        builder.connect({
            // The auth flow's token (Keycloak access token) wins over a
            // statically configured collab-token prop.
            token: token ?? props.collab?.token,
            user:
                user?.id && user.username
                    ? {
                          id: user.id,
                          name: user.username,
                      }
                    : undefined,
        }),
});

const leftWidthVw = ref(18);
const rightWidthVw = ref(22);
const leftCollapsed = ref(false);
const rightVisible = ref(false);

watch(
    () => builder.selectedElementId.value,
    (id) => {
        rightVisible.value = id !== null;
    }
);

function makeResizer(
    widthRef: Ref<number>,
    sign: 1 | -1,
    min: number,
    max: number
) {
    return (e: MouseEvent) => {
        e.preventDefault();
        document.body.classList.add('is-resizing');
        const startX = e.clientX;
        const startW = widthRef.value;
        const onMove = (ev: MouseEvent) => {
            const deltaVw = ((ev.clientX - startX) / window.innerWidth) * 100;
            widthRef.value = Math.max(
                min,
                Math.min(max, startW + sign * deltaVw)
            );
        };
        const onUp = () => {
            document.body.classList.remove('is-resizing');
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };
}

const startResizeLeft = makeResizer(leftWidthVw, 1, 12, 30);
const startResizeRight = makeResizer(rightWidthVw, -1, 15, 35);

// Initial import from the {json, ui} props (local mode only)
watch(
    [() => props.jsonSchema, () => props.uiSchema],
    () => {
        if (props.collab) return; // synced document wins in collab mode
        if (props.jsonSchema) {
            try {
                const json = JSON.parse(props.jsonSchema);
                const ui = props.uiSchema
                    ? JSON.parse(props.uiSchema)
                    : {
                          version: '2.0',
                          layout: { type: 'VerticalLayout', elements: [] },
                      };
                builder.loadFromJsonUi(json, ui);
            } catch (err) {
                console.error(
                    'Failed to import jsonSchema/uiSchema props:',
                    err
                );
            }
        }
    },
    { immediate: true }
);

// Emit derived schemas + definition whenever the form changes
let emitTimer: ReturnType<typeof setTimeout> | undefined;
// In collab mode the initial (possibly empty) synced document must not
// overwrite the legacy schema via vjfb-change — only emit once the document
// actually has content.
let collabHasContent = false;
watch(
    () => builder.formDefinition.value,
    () => {
        if (emitTimer) clearTimeout(emitTimer);
        emitTimer = setTimeout(() => {
            const schemas = builder.generateSchemas();
            if (!schemas) return;
            if (builder.isCollab && !collabHasContent) {
                const def = builder.toJSON() as {
                    root?: { children?: unknown[] };
                    elements?: Record<string, unknown>;
                } | null;
                const hasContent =
                    !!def &&
                    ((def.root?.children?.length ?? 0) > 0 ||
                        Object.keys(def.elements ?? {}).length > 0);
                if (!hasContent) return; // keep the legacy schema untouched
                collabHasContent = true;
            }
            emit('vjfb-change', schemas.jsonSchema, schemas.uiSchema);
            const definition = builder.toJSON();
            if (definition) emit('vjfb-definition-change', definition);
        }, 300);
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    if (emitTimer) clearTimeout(emitTimer);
    builder.dispose();
});

/** User-facing message for a rejected collab connection. */
const collabErrorMessages: Record<CollabErrorReason, string> = {
    unauthorized:
        'The collaboration connection was rejected — please sign in again and retry.',
    'form-not-found': 'The form does not exist (or has not been saved yet).',
    forbidden:
        'You do not have edit access to this form. Ask an owner to grant you editor or owner access.',
    'permission-denied':
        'The collaboration connection was rejected by the server.',
    unknown: 'The collaboration connection was rejected by the server.',
};
const collabErrorMessage = computed(() =>
    builder.collabError.value
        ? collabErrorMessages[builder.collabError.value]
        : null
);
</script>

<template>
    <!-- Authentication gate (only when auth is configured: keycloak or backendUrl) -->
    <AuthGate
        v-if="
            authMode !== 'local' && (checkingAuth || authError || loginRequired)
        "
        :checking-auth="checkingAuth"
        :login-required="loginRequired"
        :auth-error="authError"
        :mode="authMode"
        @sign-in="login"
        @retry="checkAuth"
    />

    <!-- The collab server rejected the connection (form missing / no edit
         access / unauthorized) — show why instead of the builder. -->
    <div
        v-else-if="builder.collabError.value"
        class="vjfb-auth d-flex align-items-center justify-content-center"
        style="min-height: 300px"
    >
        <div class="text-center" style="max-width: 32rem">
            <BAlert show variant="danger">
                {{ collabErrorMessage }}
            </BAlert>
        </div>
    </div>

    <div
        v-else
        class="vjfb d-flex flex-column h-100 overflow-hidden"
        :data-bs-theme="themeMode === 'dark' ? 'dark' : undefined"
    >
        <!-- App Header (hidden via hideHeader) -->
        <div
            v-if="!props.hideHeader"
            class="app-header d-flex align-items-center px-3 gap-2 bg-dark shadow-sm"
            data-bs-theme="dark"
        >
            <PhPencilSimple :size="16" class="text-primary" weight="bold" />
            <span class="text-white fw-semibold small"
                >JSON Forms Generator</span
            >
            <span class="text-body ms-auto" style="font-size: 0.7rem"
                >VueJsonForm v{{ version }} · UI Schema v{{
                    supportedUiSchemaVersion
                }}</span
            >
        </div>

        <div class="d-flex flex-grow-1 overflow-hidden">
            <!-- Left panel -->
            <div
                v-if="!leftCollapsed"
                class="d-flex h-100"
                :style="{ width: leftWidthVw + 'vw' }"
            >
                <LeftPanel
                    class="h-100 flex-grow-1"
                    @toggle-collapse="leftCollapsed = true"
                />
                <div
                    class="resize-handle"
                    style="width: 4px; cursor: col-resize; flex-shrink: 0"
                    @mousedown="startResizeLeft"
                />
            </div>
            <div v-else class="d-flex align-items-start py-2">
                <b-button
                    variant="link"
                    size="sm"
                    class="text-body p-1"
                    title="Expand panel"
                    @click="leftCollapsed = false"
                >
                    <PhCaretRight :size="14" weight="bold" />
                </b-button>
            </div>

            <!-- Middle panel -->
            <div class="flex-grow-1 h-100 overflow-hidden">
                <MiddlePanel class="h-100" />
            </div>

            <!-- Right panel -->
            <template v-if="rightVisible">
                <div
                    class="resize-handle"
                    style="width: 4px; cursor: col-resize; flex-shrink: 0"
                    @mousedown="startResizeRight"
                />
                <div
                    class="d-flex h-100"
                    :style="{ width: rightWidthVw + 'vw' }"
                >
                    <RightPanel class="h-100 flex-grow-1" />
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.resize-handle:hover {
    background-color: var(--bs-primary, #0d6efd) !important;
}
</style>
