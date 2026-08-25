<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import PaletteItem from './PaletteItem.vue';
import {
    PALETTE_MARKER_PREFIX,
    getPaletteField,
    type PaletteField,
    type PaletteElementType,
} from '@/types/paletteFields';
import { setDragSource, setDragging } from '../../useDragState';

withDefaults(
    defineProps<{
        fields: PaletteField[];
        compact?: boolean;
    }>(),
    { compact: false }
);

const emit = defineEmits<{
    fieldClick: [field: PaletteField];
}>();

function cloneField(field: PaletteField): string {
    return PALETTE_MARKER_PREFIX + field.id;
}
function onDragStart(e: any) {
    const item = e?.item as HTMLElement | undefined;
    const fieldId = item?.dataset?.paletteType as
        PaletteElementType | undefined;
    if (item && fieldId) {
        // SortableJS `put` checks dragEl.dataset.elementType for type
        // filtering — palette fields filter by their registry type (e.g.
        // every string format variant is 'string').
        const field = getPaletteField(fieldId);
        const filterType = field?.elementType ?? fieldId;
        item.dataset.elementType = filterType;
        setDragSource(filterType);
    }
    setDragging(true);
    document.body.classList.add('is-dragging-palette');
}

function onDragEnd() {
    setDragSource(null);
    setDragging(false);
    document.body.classList.remove('is-dragging-palette');
}
</script>

<template>
    <VueDraggable
        :model-value="fields"
        :group="{ name: 'form-elements', pull: 'clone', put: false }"
        :sort="false"
        :clone="cloneField"
        drag-class="sortable-drag"
        chosen-class="sortable-chosen"
        class="row g-1"
        @start="onDragStart"
        @end="onDragEnd"
    >
        <div v-for="field in fields" :key="field.id" class="col-6 d-flex">
            <PaletteItem
                :field="field"
                :compact="compact"
                class="w-100"
                @click="emit('fieldClick', field)"
            />
        </div>
    </VueDraggable>
</template>
