<script setup lang="ts">
import { createPinia, getActivePinia, setActivePinia } from 'pinia';

setActivePinia(getActivePinia() || createPinia());

import { ref, watch, type Ref } from 'vue';
import { BApp } from 'bootstrap-vue-next';
import { useFormStore } from './stores/formStore';
import LeftPanel from './components/LeftPanel/LeftPanel.vue';
import MiddlePanel from './components/MiddlePanel/MiddlePanel.vue';
import RightPanel from './components/RightPanel/RightPanel.vue';
import { supportedUiSchemaVersion, version } from '@educorvi/vue-json-form';
import type { UISchema } from '@educorvi/vue-json-form';
import { generateUISchema } from '@educorvi/vue-json-form';
import { useImportState } from '@/components/MiddlePanel/import/useImportState.ts';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';

const store = useFormStore();

const leftWidthVw = ref(18);
const rightWidthVw = ref(22);
const leftCollapsed = ref(false);
const rightVisible = ref(false);

watch(
    () => store.selectedElementId,
    (id) => {
        if (id !== null) rightVisible.value = true;
    }
);

function makeResizer(
    widthRef: Ref<number>,
    sign: 1 | -1,
    min: number,
    max: number
) {
    return (e: MouseEvent) => {
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
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };
}

const startResizeLeft = makeResizer(leftWidthVw, 1, 12, 30);
const startResizeRight = makeResizer(rightWidthVw, -1, 15, 35);

const props = defineProps<{
    jsonSchema?: string;
    uiSchema?: string;
    hideHeader?: boolean;
}>();

const emit = defineEmits<{
    'vjfb-change': [jsonSchema: JSONSchema, uiSchema: UISchema];
}>();

const importStore = useImportState({
    loadSchemas: (json, ui) => store.loadSchemas(json, ui),
    onSuccess: () => {
        console.log('Imported');
    },
    onError: (message, error) => {
        console.error('Import failed', message, error);
    },
});

watch(
    [() => props.jsonSchema, () => props.uiSchema],
    () => {
        if (props.jsonSchema) {
            const localUiSchema: string = props.uiSchema
                ? props.uiSchema
                : JSON.stringify(
                      generateUISchema(JSON.parse(props.jsonSchema))
                  );

            importStore.jsonText.value = props.jsonSchema;
            importStore.uiText.value = localUiSchema;
            importStore.activeTab.value = 0;
            importStore.doImport();
        }
    },
    {
        immediate: true,
    }
);

watch([() => store.jsonSchema, () => store.uiSchema], () => {
    console.warn('vjfb-change-inner', store.jsonSchema, store.uiSchema);
    emit(
        'vjfb-change',
        store.jsonSchema,
        store.uiSchema as unknown as UISchema
    );
});
</script>

<template>
    <BApp>
        <div
            class="d-flex flex-column vh-100 overflow-hidden"
            :data-bs-theme="store.themeMode === 'dark' ? 'dark' : undefined"
        >
            <!-- App Header -->
            <div
                v-if="!props.hideHeader"
                class="app-header d-flex align-items-center px-3 gap-2 bg-dark shadow-sm"
                data-bs-theme="dark"
            >
                <i class="bi bi-pencil-square text-primary" />
                <span class="text-white fw-semibold small"
                    >JSON Forms Generator</span
                >
                <span class="text-body ms-auto" style="font-size: 0.7rem"
                    >VueJsonForm v{{ version }} · UI Schema v{{
                        supportedUiSchemaVersion
                    }}</span
                >
            </div>

            <!-- Three-panel layout -->
            <div class="d-flex flex-grow-1 overflow-hidden">
                <!-- Left Panel + collapse toggle -->
                <div class="d-flex flex-shrink-0">
                    <div
                        class="overflow-hidden"
                        :style="
                            leftCollapsed
                                ? { width: '0' }
                                : { width: leftWidthVw + 'vw' }
                        "
                    >
                        <LeftPanel
                            @toggle-collapse="leftCollapsed = !leftCollapsed"
                        />
                    </div>
                    <button
                        v-if="leftCollapsed"
                        class="btn btn-sm btn-light border-end px-1 rounded-0 flex-shrink-0"
                        title="Expand panel"
                        @click="leftCollapsed = false"
                    >
                        <i class="bi bi-chevron-right" />
                    </button>
                </div>

                <!-- Left Resize Handle -->
                <div
                    v-if="!leftCollapsed"
                    class="resize-handle"
                    @mousedown="startResizeLeft"
                />

                <!-- Middle Panel -->
                <div class="flex-grow-1 overflow-hidden">
                    <MiddlePanel />
                </div>

                <!-- Right Resize Handle -->
                <div
                    v-if="rightVisible && store.selectedElementId"
                    class="resize-handle"
                    @mousedown="startResizeRight"
                />

                <!-- Right Panel -->
                <div
                    v-if="rightVisible && store.selectedElementId"
                    class="flex-shrink-0 overflow-hidden"
                    :style="{ width: rightWidthVw + 'vw' }"
                >
                    <RightPanel @close="rightVisible = false" />
                </div>
            </div>
        </div>
    </BApp>
</template>
