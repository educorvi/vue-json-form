<script setup lang="ts">
import { computed, ref } from 'vue';
import { BModal, BButton } from 'bootstrap-vue-next';
import { useFormStore } from '@/stores/formStore';
import type { WizardElement, WizardPage, FormElement } from '@/types/formTypes';
import DropZone from './DropZone.vue';

const props = defineProps<{
    element: WizardElement;
    isRoot: boolean;
}>();

const store = useFormStore();

const activeIdx = computed(() =>
    Math.max(
        0,
        Math.min(store.activeWizardPageIndex, props.element.pages.length - 1)
    )
);

const activePage = computed<WizardPage | undefined>(
    () => props.element.pages[activeIdx.value]
);

const pageChildren = computed({
    get: (): FormElement[] => activePage.value?.elements ?? [],
    set: (val: FormElement[]) => {
        if (activePage.value) activePage.value.elements = val;
    },
});

const layoutTypeOpts = [
    { label: 'Vertical', value: 'VerticalLayout', icon: 'bi bi-list' },
    { label: 'Horizontal', value: 'HorizontalLayout', icon: 'bi bi-table' },
    { label: 'Group', value: 'Group', icon: 'bi bi-folder' },
];

function setPageType(type: 'VerticalLayout' | 'HorizontalLayout' | 'Group') {
    if (activePage.value) activePage.value.type = type;
}

function removePage(index: number) {
    const page = props.element.pages[index];
    const hasContent = (page?.elements.length ?? 0) > 0;
    if (hasContent) {
        if (
            window.confirm(
                'This page has elements that will be deleted. Remove anyway?'
            )
        ) {
            store.removeWizardPage(index);
        }
    } else {
        store.removeWizardPage(index);
    }
}

const showSwitchConfirm = ref(false);
const pendingSwitchType = ref<'VerticalLayout' | 'HorizontalLayout' | 'Group'>('VerticalLayout');

function switchToLayout(type: 'VerticalLayout' | 'HorizontalLayout' | 'Group') {
    const hasContent = props.element.pages.some((p) => p.elements.length > 0);
    if (hasContent) {
        pendingSwitchType.value = type;
        showSwitchConfirm.value = true;
    } else {
        store.setRootToLayout(type);
    }
}

function doSwitchToLayout() {
    store.setRootToLayout(pendingSwitchType.value);
}
</script>

<template>
    <!-- Root toolbar -->
    <div
        v-if="isRoot"
        class="d-flex align-items-center gap-1 px-2 py-1 border-bottom flex-wrap"
        @click.stop
    >
        <b-button
            v-for="opt in layoutTypeOpts"
            :key="opt.value"
            variant="outline-secondary"
            size="sm"
            class="py-0 px-1"
            @click="switchToLayout(opt.value as any)"
        >
            <i :class="opt.icon" class="me-1" />{{ opt.label }}
        </b-button>
        <div class="vr" />
        <b-button
            variant="primary"
            size="sm"
            class="py-0 px-1 disabled"
        >
            <i class="bi bi-book me-1" />Wizard
        </b-button>
    </div>

    <!-- Page tabs -->
    <div
        class="d-flex align-items-center gap-1 px-2 py-1 border-bottom overflow-x-auto"
        @click.stop
    >
        <b-button
            v-for="(page, i) in element.pages"
            :key="page._id"
            size="sm"
            class="py-0 px-2 text-xs flex-shrink-0"
            :variant="
                i === activeIdx ? 'primary' : 'outline-secondary'
            "
            @click="store.activeWizardPageIndex = i"
        >
            {{ page.options?.label ?? `Page ${i + 1}` }}
            <i
                v-if="element.pages.length > 1"
                class="bi bi-x ms-1 opacity-75"
                @click.stop="removePage(i)"
            />
        </b-button>
        <b-button
            variant="outline-secondary"
            size="sm"
            class="py-0 px-1 flex-shrink-0"
            title="Add page"
            @click.stop="store.addWizardPage()"
        >
            <i class="bi bi-plus" />
        </b-button>
    </div>

    <!-- Active page layout switcher -->
    <div
        v-if="activePage"
        class="d-flex align-items-center gap-1 px-2 py-1 border-bottom"
        @click.stop
    >
        <span class="text-xs text-body me-1">Page layout:</span>
        <b-button
            v-for="opt in layoutTypeOpts"
            :key="opt.value"
            size="sm"
            class="py-0 px-1 text-xs"
            :variant="
                activePage.type === opt.value
                    ? 'primary'
                    : 'outline-secondary'
            "
            @click="setPageType(opt.value as any)"
        >
            <i :class="opt.icon" class="me-1" />{{ opt.label }}
        </b-button>
    </div>

    <!-- Drop zone for active page -->
    <DropZone
        v-if="activePage"
        v-model:children="pageChildren"
        :allowed-types="'*'"
        :layout="
            activePage.type === 'HorizontalLayout' ? 'horizontal' : 'vertical'
        "
        :empty-label="isRoot ? '' : 'Drop elements here'"
        :parent-id="activePage._id"
    >
        <template v-if="isRoot && pageChildren.length === 0" #empty>
            <div
                class="d-flex flex-column align-items-center justify-content-center py-5 text-body canvas-preview"
            >
                <i
                    class="bi bi-arrow-left d-block mb-2"
                    style="font-size: 1.5rem"
                />
                <p class="small fw-medium mb-0">Drag fields here to build this page</p>
                <p class="text-xs mt-1 mb-0">Or click a field in the left panel</p>
            </div>
        </template>
    </DropZone>

    <!-- Switch layout confirm modal -->
    <BModal
        v-model="showSwitchConfirm"
        title="Switch to Layout"
        ok-variant="danger"
        ok-title="Switch"
        cancel-title="Cancel"
        @ok="doSwitchToLayout"
    >
        Switching to Layout will remove all Wizard pages and their elements. Continue?
    </BModal>
</template>
