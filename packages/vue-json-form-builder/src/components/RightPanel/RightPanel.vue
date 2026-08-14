<script setup lang="ts">
import { computed } from 'vue';
import { BButton } from 'bootstrap-vue-next';
import { PhSliders, PhX, PhMinus } from '@phosphor-icons/vue';
import { useFormBuilder } from '../../useFormBuilder';
import { useElementSettings } from './settings/useElementSettings';
import { uiFor } from '@/elements';
import ElementSettings from './settings/ElementSettings.vue';

const builder = useFormBuilder();
const { element: selected } = useElementSettings();

const typeLabel = computed(() => {
    const el = selected.value;
    if (!el) return 'Settings';
    return uiFor(el).settingsLabel;
});

/** The data-type tag — from the element's ElementUi (only data elements have one). */
const dataType = computed(() => {
    const el = selected.value;
    return el ? uiFor(el).dataType(el) : undefined;
});

function closePanel() {
    builder.selectElement(null);
}
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
        <div v-if="!selected" class="text-center text-body py-4">
            <PhMinus :size="24" weight="bold" class="d-block mb-2 mx-auto" />
            <p class="small">
                Select an element on the canvas to edit its settings.
            </p>
        </div>

        <div v-else class="flex-grow-1 overflow-y-auto p-3">
            <div class="small text-body-secondary mb-3">
                <span v-if="dataType" class="badge text-bg-light border me-2">
                    {{ dataType }}
                </span>
                <code>{{ selected.id }}</code>
            </div>

            <!-- Per-class settings — composed along the class hierarchy from
                 the form schema definitions package -->
            <ElementSettings />
        </div>
    </div>
</template>
