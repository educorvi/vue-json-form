<script setup lang="ts">
import { ref, computed } from 'vue';
import { PhMagnifyingGlass } from '@phosphor-icons/vue';
import {
    paletteSections,
    filterPaletteSections,
    type PaletteField,
    type PaletteElementType,
} from '@/types/paletteFields';
import { useFormBuilder } from '../../useFormBuilder';
import PaletteSection from './PaletteSection.vue';

const builder = useFormBuilder();

const searchQuery = ref('');

const isSearching = computed(() => searchQuery.value.trim().length > 0);

/**
 * Same section tree in both states — while searching it is filtered so the
 * collapsible cards stay intact and only non-matching fields disappear.
 */
const visibleSections = computed(() =>
    filterPaletteSections(paletteSections, searchQuery.value)
);

const noResults = computed(
    () => isSearching.value && visibleSections.value.length === 0
);

function addToRoot(type: PaletteElementType) {
    const fd = builder.formDefinition.value;
    if (!fd) return;
    const element = builder.addElement(fd.root.uid, type);
    if (element) builder.selectElement(element.uid);
}

function addField(field: PaletteField) {
    addToRoot(field.id);
}
</script>

<template>
    <div class="d-flex flex-column h-100 overflow-hidden">
        <!-- Search -->
        <div class="p-2 flex-shrink-0">
            <div class="input-group input-group-sm">
                <span class="input-group-text"
                    ><PhMagnifyingGlass :size="14" weight="bold"
                /></span>
                <input
                    v-model="searchQuery"
                    type="text"
                    class="form-control"
                    placeholder="Search fields..."
                />
            </div>
        </div>

        <!-- Categorized fields — collapsible section cards in both states -->
        <div class="flex-grow-1 overflow-y-auto px-2 pb-2">
            <PaletteSection
                v-for="section in visibleSections"
                :key="section.id"
                :section="section"
                :filter="searchQuery"
                @field-click="addField"
            />

            <div
                v-if="noResults"
                class="text-center text-body-tertiary small py-4"
            >
                <PhMagnifyingGlass :size="16" weight="bold" />
                No fields match "{{ searchQuery }}"
            </div>
        </div>
    </div>
</template>
