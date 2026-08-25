<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { PhCaretRight } from '@phosphor-icons/vue';
import {
    createFormBuilder,
    provideFormBuilder,
    type CollabConfig,
} from './useFormBuilder';
import { useUiState } from './useUiState';
import { useCollabConnection } from './composables/useCollabConnection';
import { usePanelLayout } from './composables/usePanelLayout';
import { useSchemaImport } from './composables/useSchemaImport';
import { useDefinitionEmit } from './composables/useDefinitionEmit';
import type { KeycloakAuthConfig } from '@/composables/useBuilderAuth';
import AuthGate from './components/AuthGate.vue';
import AppHeader from './components/AppHeader.vue';
import CollabErrorAlert from './components/CollabErrorAlert.vue';
import LeftPanel from './components/LeftPanel/LeftPanel.vue';
import MiddlePanel from './components/MiddlePanel/MiddlePanel.vue';
import RightPanel from './components/RightPanel/RightPanel.vue';

/**
 * <VueJsonFormBuilder> — the full form builder (local or collab mode).
 * Props: jsonSchema/uiSchema (initial schemas, local mode), collab
 * (Hocuspocus config), backendUrl/keycloak (auth modes), hideHeader,
 * openInBuilder. Emits vjfb-change and vjfb-definition-change.
 * See the package README for the full reference.
 */
const props = withDefaults(
    defineProps<{
        jsonSchema?: string;
        uiSchema?: string;
        hideHeader?: boolean;
        openInBuilder?: boolean;
        collab?: CollabConfig | null;
        keycloak?: KeycloakAuthConfig | null;
        backendUrl?: string;
        keycloakIdpHint?: string;
    }>(),
    {
        hideHeader: false,
        openInBuilder: true,
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

// With auth configured, the collab websocket connects only after
// authentication produced the credentials (see useCollabConnection).
const builder = createFormBuilder(props.collab, {
    autoConnect: !props.backendUrl && !props.keycloak,
});
provideFormBuilder(builder);
const { themeMode } = useUiState();

const {
    authMode,
    checkingAuth,
    loginRequired,
    authError,
    checkAuth,
    login,
    builderBackendUrl,
} = useCollabConnection(builder, {
    backendUrl: computed(() => props.backendUrl),
    keycloakIdpHint: computed(() => props.keycloakIdpHint),
    keycloak: computed(() => props.keycloak ?? undefined),
    collab: computed(() => props.collab),
});

const {
    leftWidthVw,
    rightWidthVw,
    leftCollapsed,
    rightVisible,
    startResizeLeft,
    startResizeRight,
} = usePanelLayout(builder);

useSchemaImport(
    builder,
    computed(() => props.jsonSchema),
    computed(() => props.uiSchema),
    computed(() => !props.collab)
);

const stopEmitting = useDefinitionEmit(builder, emit);

onBeforeUnmount(() => {
    stopEmitting();
    builder.dispose();
});
</script>

<template>
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

    <CollabErrorAlert
        v-else-if="builder.collabError.value"
        :reason="builder.collabError.value"
    />

    <div
        v-else
        class="vjfb d-flex flex-column h-100 overflow-hidden"
        :data-bs-theme="themeMode === 'dark' ? 'dark' : undefined"
    >
        <AppHeader
            v-if="!props.hideHeader"
            :open-in-builder="props.openInBuilder"
            :builder-url="builderBackendUrl"
            :document-name="props.collab?.documentName"
        />

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
