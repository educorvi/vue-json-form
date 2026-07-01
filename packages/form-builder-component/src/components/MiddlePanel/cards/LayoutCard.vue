<script setup lang="ts">
import { computed, ref } from 'vue';
import { BModal, BButton } from 'bootstrap-vue-next';
import { useFormStore } from '@/stores/formStore';
import type { LayoutElement, FormElement } from '@/types/formTypes';
import { wrapElement } from '@/types/elements/index';
import DropZone from './DropZone.vue';

const props = defineProps<{
    element: LayoutElement;
    isRoot: boolean;
}>();

const store = useFormStore();

const node = computed(() => wrapElement(props.element));
const dropZone = computed(() => node.value.dropZone!);

const children = computed({
    get: () => node.value.children ?? [],
    set: (val: FormElement[]) => {
        node.value.children = val;
    },
});

const layoutTypeOpts = [
    { label: 'Vertical', value: 'VerticalLayout', icon: 'bi bi-list' },
    { label: 'Horizontal', value: 'HorizontalLayout', icon: 'bi bi-table' },
    { label: 'Group', value: 'Group', icon: 'bi bi-folder' },
];

const showWizardConfirm = ref(false);

function switchToWizard() {
    if (children.value.length > 0) {
        showWizardConfirm.value = true;
    } else {
        store.setRootToWizard();
    }
}

function doSwitchToWizard() {
    store.setRootToWizard();
}
</script>

<template>
    <!-- Layout type switcher -->
    <div
        class="d-flex align-items-center gap-1 px-2 py-1 border-bottom flex-wrap"
        @click.stop
    >
        <b-button
            v-for="opt in layoutTypeOpts"
            :key="opt.value"
            size="sm"
            :variant="
                element.type === opt.value ? 'primary' : 'outline-secondary'
            "
            @click="
                store.updateElement(element._id, { type: opt.value as any })
            "
        >
            <i :class="opt.icon" class="me-1" />{{ opt.label }}
        </b-button>
        <template v-if="isRoot">
            <div class="vr" />
            <b-button
                @click="switchToWizard"
                size="sm"
                variant="outline-secondary"
            >
                <i class="bi bi-book me-1" />Wizard
            </b-button>
        </template>
    </div>

    <!-- Drop zone -->
    <DropZone
        v-model:children="children"
        :allowed-types="dropZone.allowedTypes"
        :layout="dropZone.layout"
        :empty-label="isRoot ? '' : dropZone.emptyLabel"
        :parent-id="element._id"
    >
        <template v-if="isRoot && children.length === 0" #empty>
            <div
                class="d-flex flex-column align-items-center justify-content-center py-5 text-body canvas-preview"
            >
                <i
                    class="bi bi-arrow-left d-block mb-2"
                    style="font-size: 1.5rem"
                />
                <p class="small fw-medium mb-0">
                    Drag fields here to build your form
                </p>
                <p class="text-xs mt-1 mb-0">
                    Or click a field in the left panel
                </p>
            </div>
        </template>
    </DropZone>

    <!-- Wizard switch confirm modal -->
    <BModal
        v-model="showWizardConfirm"
        title="Switch to Wizard"
        ok-variant="danger"
        ok-title="Switch"
        cancel-title="Cancel"
        @ok="doSwitchToWizard"
    >
        Switching to Wizard will remove all current elements. Continue?
    </BModal>
</template>

