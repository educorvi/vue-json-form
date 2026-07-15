<script setup lang="ts">
import { computed, ref } from 'vue';
import { BModal, BButton } from 'bootstrap-vue-next';
import { useFormStore } from '@/stores/formStore';
import type { LayoutElement, FormElement } from '@/types/formTypes';
import { wrapElement } from '@/types/elements/index';
import DropZone from './DropZone.vue';
import { PhList, PhTable, PhFolder, PhBook } from '@phosphor-icons/vue';
import EmptyDropTarget from '@/components/shared/EmptyDropTarget.vue';

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
    { label: 'Vertical', value: 'VerticalLayout', icon: PhList },
    { label: 'Horizontal', value: 'HorizontalLayout', icon: PhTable },
    { label: 'Group', value: 'Group', icon: PhFolder },
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
        class="d-flex align-items-center px-2 py-1 border-bottom flex-wrap gap-1"
        @click.stop
    >
        <div class="btn-group btn-group-sm" role="group">
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
                <component
                    :is="opt.icon"
                    :size="12"
                    weight="bold"
                    class="me-1"
                />{{ opt.label }}
            </b-button>
        </div>
        <template v-if="isRoot">
            <div class="vr mx-1" />
            <BButton
                @click="switchToWizard"
                size="sm"
                variant="outline-secondary"
            >
                <PhBook :size="12" weight="bold" class="me-1" />Wizard
            </BButton>
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
            <EmptyDropTarget message="Drag fields here to build your form" />
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
