<script setup lang="ts">
import { computed } from 'vue';
import { BButton } from 'bootstrap-vue-next';
import { PhSliders, PhX, PhMinus } from '@phosphor-icons/vue';
import { useFormStore } from '@/stores/formStore';
import ControlSettings from './old/ControlSettings.vue';
import LayoutSettings from './old/LayoutSettings.vue';
import ButtonSettings from './old/ButtonSettings.vue';
import HTMLSettings from './old/HTMLSettings.vue';
import ObjectSettings from './old/ObjectSettings.vue';
import ArraySettings from './old/ArraySettings.vue';
import WizardSettings from './old/WizardSettings.vue';
import type {
    ControlElement,
    LayoutElement,
    ButtonElement,
    HTMLElement_,
    ObjectElement,
    ArrayElement,
    WizardElement,
} from '@/types/formTypes';

const emit = defineEmits<{ close: [] }>();

const store = useFormStore();

function closePanel() {
    store.selectElement(null);
    emit('close');
}

const typeLabel = computed(() => {
    const el = store.selectedElement;
    if (!el) return '';
    const labels: Record<string, string> = {
        Control: 'Field Settings',
        VerticalLayout: 'Vertical Layout',
        HorizontalLayout: 'Horizontal Layout',
        Group: 'Group Settings',
        Button: 'Button Settings',
        HTML: 'HTML Block',
        Divider: 'Divider',
        Object: 'Object Settings',
        Array: 'Array Settings',
        Wizard: 'Wizard Settings',
    };
    return labels[el.type] ?? 'Settings';
});
</script>

<template>
    <div class="d-flex flex-column h-100 border-start bg-body overflow-hidden">
        <!-- Header -->
        <div
            class="d-flex align-items-center gap-2 px-3 py-2 border-bottom flex-shrink-0"
        >
            <PhSliders :size="16" class="text-primary" weight="bold" />
            <span class="small fw-semibold text-body text-truncate flex-grow-1">
                {{ typeLabel }}
            </span>
            <BButton
                variant="link"
                size="sm"
                class="p-0 border-0 text-body text-decoration-none ms-auto"
                title="Close panel"
                @click="closePanel"
            >
                <PhX :size="16" weight="bold" />
            </BButton>
        </div>

        <!-- Settings content -->
        <div class="flex-grow-1 overflow-y-auto p-3">
            <ControlSettings
                v-if="store.selectedElement?.type === 'Control'"
                :element="store.selectedElement as ControlElement"
            />
            <LayoutSettings
                v-else-if="
                    store.selectedElement &&
                    ['VerticalLayout', 'HorizontalLayout', 'Group'].includes(
                        store.selectedElement.type
                    )
                "
                :element="store.selectedElement as LayoutElement"
            />
            <ButtonSettings
                v-else-if="store.selectedElement?.type === 'Button'"
                :element="store.selectedElement as ButtonElement"
            />
            <HTMLSettings
                v-else-if="store.selectedElement?.type === 'HTML'"
                :element="store.selectedElement as HTMLElement_"
            />
            <ObjectSettings
                v-else-if="store.selectedElement?.type === 'Object'"
                :element="store.selectedElement as ObjectElement"
            />
            <ArraySettings
                v-else-if="store.selectedElement?.type === 'Array'"
                :element="store.selectedElement as ArrayElement"
            />
            <WizardSettings
                v-else-if="store.selectedElement?.type === 'Wizard'"
                :element="store.selectedElement as WizardElement"
            />
            <div v-else class="text-center text-body py-4">
                <PhMinus
                    :size="24"
                    weight="bold"
                    class="d-block mb-2 mx-auto"
                />
                <p class="small">No settings for this element</p>
            </div>
        </div>
    </div>
</template>
