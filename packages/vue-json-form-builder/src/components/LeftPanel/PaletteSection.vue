<script setup lang="ts">
import { ref, watch } from 'vue';
import { PhCaretDown, PhCaretRight } from '@phosphor-icons/vue';
import type { PaletteField, PaletteSection } from '@/types/paletteFields';
import PaletteFieldGrid from './PaletteFieldGrid.vue';

const props = defineProps<{
    section: PaletteSection;
    level?: number;
    /** active search query — auto-expands the section so matches are visible */
    filter?: string;
}>();
const emit = defineEmits<{ fieldClick: [field: PaletteField] }>();

const expanded = ref(true);

watch(
    () => props.filter,
    (filter) => {
        if (filter && filter.trim()) expanded.value = true;
    }
);
</script>

<template>
    <div class="palette-section">
        <!-- Section header (click to collapse/expand) -->
        <button
            type="button"
            class="d-flex align-items-center gap-2 w-100 border-0 bg-transparent text-start px-1 py-1 rounded"
            :class="level ? 'ps-2' : ''"
            @click="expanded = !expanded"
        >
            <i :class="section.icon" class="text-primary flex-shrink-0" />
            <span class="small fw-semibold text-body flex-grow-1">
                {{ section.label }}
            </span>
            <PhCaretDown v-if="expanded" :size="12" weight="bold" />
            <PhCaretRight v-else :size="12" weight="bold" />
        </button>

        <!-- Section body: sub-sections or the field grid -->
        <div v-if="expanded" class="ps-1">
            <template v-if="section.sections">
                <PaletteSection
                    v-for="sub in section.sections"
                    :key="sub.id"
                    :section="sub"
                    :level="(level ?? 0) + 1"
                    class="mt-1"
                    @field-click="emit('fieldClick', $event)"
                />
            </template>
            <PaletteFieldGrid
                v-else-if="section.fields"
                :fields="section.fields"
                :compact="level !== undefined"
                class="mt-1"
                @field-click="emit('fieldClick', $event)"
            />
        </div>
    </div>
</template>
