<script setup lang="ts">
import { ref, computed } from 'vue';
import { BButton } from 'bootstrap-vue-next';
import {
    PhMagnifyingGlass,
    PhFolder,
    PhCaretRight,
    PhCaretDown,
} from '@phosphor-icons/vue';
import { paletteSections, getAllPaletteFields } from '@/types/paletteFields';
import { useFormStore } from '@/stores/formStore';
import PaletteFieldGrid from './PaletteFieldGrid.vue';
import type { PaletteField } from '@/types/formTypes';

const store = useFormStore();
const searchQuery = ref('');
const collapsed = ref<Set<string>>(new Set());

function toggleSection(id: string) {
    if (collapsed.value.has(id)) collapsed.value.delete(id);
    else collapsed.value.add(id);
}

const allFields = getAllPaletteFields();

const searchResults = computed(() => {
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return [];
    return allFields.filter(
        (f) =>
            f.label.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q)
    );
});

const isSearching = computed(() => searchQuery.value.trim().length > 0);

function cloneItem(field: PaletteField) {
    const element = field.createElement();
    if (field.createSchemaProperty) {
        const { key, schema } = field.createSchemaProperty();
        if (element.type === 'Control') {
            element.scope = `/properties/${key}`;
            store.addJsonSchemaProperty(key, schema);
        }
    }
    return element;
}

function addField(fieldId: string) {
    const field = allFields.find((f) => f.id === fieldId);
    if (!field) return;
    const element = cloneItem(field);
    store.addElementToRoot(element);
    store.selectElement(element._id);
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

        <!-- Search results -->
        <div v-if="isSearching" class="flex-grow-1 overflow-y-auto px-2 pb-2">
            <PaletteFieldGrid
                :fields="searchResults"
                :clone="cloneItem"
                @field-click="addField"
            />
            <div
                v-if="searchResults.length === 0"
                class="text-center text-body-tertiary small py-4"
            >
                <PhMagnifyingGlass :size="16" weight="bold" />
                No fields match "{{ searchQuery }}"
            </div>
        </div>

        <!-- Hierarchical sections -->
        <div v-else class="flex-grow-1 overflow-y-auto px-2 pb-2">
            <div
                v-for="section in paletteSections"
                :key="section.id"
                class="mb-1"
            >
                <BButton
                    variant="link"
                    size="sm"
                    class="w-100 text-decoration-none d-flex align-items-center gap-1 px-1 py-1 text-body-secondary"
                    @click="toggleSection(section.id)"
                >
                    <i
                        :class="section.icon ?? 'ph ph-folder'"
                        class="text-body-secondary"
                        style="font-size: 0.75rem"
                    />
                    <span
                        class="text-xs fw-semibold text-uppercase flex-grow-1 text-start text-body-secondary"
                    >
                        {{ section.label }}
                    </span>
                    <PhCaretDown
                        v-if="!collapsed.has(section.id)"
                        :size="12"
                        weight="bold"
                        class="text-body-secondary"
                    />
                    <PhCaretRight
                        v-else
                        :size="12"
                        weight="bold"
                        class="text-body-secondary"
                    />
                </BButton>

                <div v-if="!collapsed.has(section.id)" class="ps-1 pb-1">
                    <PaletteFieldGrid
                        v-if="section.fields?.length"
                        :fields="section.fields"
                        :clone="cloneItem"
                        class="mb-1"
                        @field-click="addField"
                    />

                    <div
                        v-for="sub in section.sections"
                        :key="sub.id"
                        class="mb-1"
                    >
                        <BButton
                            variant="link"
                            size="sm"
                            class="w-100 text-decoration-none d-flex align-items-center gap-1 px-1 py-0 text-body-secondary"
                            @click="toggleSection(sub.id)"
                        >
                            <i
                                :class="sub.icon ?? 'ph ph-circle'"
                                class="text-body-secondary"
                                style="font-size: 0.65rem"
                            />
                            <span
                                class="text-xs flex-grow-1 text-start text-body-secondary"
                                >{{ sub.label }}</span
                            >
                            <PhCaretDown
                                v-if="!collapsed.has(sub.id)"
                                :size="11"
                                weight="bold"
                                class="text-body-secondary"
                            />
                            <PhCaretRight
                                v-else
                                :size="11"
                                weight="bold"
                                class="text-body-secondary"
                            />
                        </BButton>

                        <PaletteFieldGrid
                            v-if="!collapsed.has(sub.id) && sub.fields?.length"
                            :fields="sub.fields"
                            :clone="cloneItem"
                            compact
                            class="ps-1 mt-0 mb-1"
                            @field-click="addField"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
