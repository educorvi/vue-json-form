<script setup lang="ts">
import { computed, ref } from 'vue';
import { BModal, BButton } from 'bootstrap-vue-next';
import {
    PhList,
    PhTable,
    PhFolder,
    PhBook,
    PhPlus,
    PhX,
} from '@phosphor-icons/vue';
import EmptyDropTarget from '@/components/shared/EmptyDropTarget.vue';
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
    { label: 'Vertical', value: 'VerticalLayout', icon: PhList },
    { label: 'Horizontal', value: 'HorizontalLayout', icon: PhTable },
    { label: 'Group', value: 'Group', icon: PhFolder },
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
const pendingSwitchType = ref<'VerticalLayout' | 'HorizontalLayout' | 'Group'>(
    'VerticalLayout'
);

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
        class="d-flex align-items-center px-2 py-1 border-bottom flex-wrap gap-1"
        @click.stop
    >
        <div class="btn-group btn-group-sm" role="group">
            <BButton
                v-for="opt in layoutTypeOpts"
                :key="opt.value"
                variant="outline-secondary"
                size="sm"
                @click="switchToLayout(opt.value as any)"
            >
                <component
                    :is="opt.icon"
                    :size="12"
                    weight="bold"
                    class="me-1"
                />
                {{ opt.label }}
            </BButton>
        </div>
        <div class="vr mx-1" />
        <BButton variant="primary" size="sm">
            <PhBook :size="12" weight="bold" class="me-1" />Wizard
        </BButton>
    </div>

    <!-- Page tabs as nav-pills -->
    <div class="d-flex align-items-center border-bottom" @click.stop>
        <div
            class="btn-group btn-group-sm flex-nowrap overflow-x-auto py-1 ps-1 pe-0 gap-1"
        >
            <button
                v-for="(page, i) in element.pages"
                :key="page._id"
                class="btn btn-sm py-1 px-2 text-nowrap text-xs"
                :class="
                    store.activeWizardPageIndex === i
                        ? 'btn-primary'
                        : 'btn-outline-secondary'
                "
                @click="store.activeWizardPageIndex = i"
            >
                {{ page.options?.label ?? `Page ${i + 1}` }}
                <PhX
                    v-if="element.pages.length > 1"
                    :size="10"
                    weight="bold"
                    class="ms-1"
                    style="cursor: pointer"
                    @click.stop="removePage(i)"
                />
            </button>
        </div>
        <BButton
            variant="outline-secondary"
            size="sm"
            class="py-0 px-1 flex-shrink-0 ms-auto me-1"
            title="Add page"
            @click.stop="store.addWizardPage()"
        >
            <PhPlus :size="12" weight="bold" />
        </BButton>
    </div>

    <!-- Active page layout switcher -->
    <div
        v-if="activePage"
        class="d-flex align-items-center gap-1 px-2 py-1 border-bottom"
        @click.stop
    >
        <span class="text-xs text-body me-1">Page layout:</span>
        <div class="btn-group btn-group-sm" role="group">
            <BButton
                v-for="opt in layoutTypeOpts"
                :key="opt.value"
                size="sm"
                :variant="
                    activePage.type === opt.value
                        ? 'primary'
                        : 'outline-secondary'
                "
                @click="setPageType(opt.value as any)"
            >
                <component
                    :is="opt.icon"
                    :size="12"
                    weight="bold"
                    class="me-1"
                />
                {{ opt.label }}
            </BButton>
        </div>
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
            <EmptyDropTarget message="Drag fields here to build this page" />
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
        Switching to Layout will remove all Wizard pages and their elements.
        Continue?
    </BModal>
</template>
