<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus';
import PaletteItem from './PaletteItem.vue';
import type { PaletteField, FormElement } from '@/types/formTypes';
import { useFormStore } from '@/stores/formStore';
import { BCardGroup } from 'bootstrap-vue-next';

const props = defineProps<{
    fields: PaletteField[];
    clone: (field: PaletteField) => FormElement;
}>();

const emit = defineEmits<{ fieldClick: [id: string] }>();

const store = useFormStore();

function onDragStart(e: any) {
    const field = props.fields[e.oldIndex];
    if (field) {
        const type = field.createElement().type;
        store.setDragSource(type);
        const el = e.item as HTMLElement;
        if (el) el.dataset.elementType = type;
    }
    document.body.classList.add('is-dragging-palette');
}

function onDragEnd() {
    store.setDragSource(null);
    document.body.classList.remove('is-dragging-palette');
}
</script>

<template>
    <VueDraggable
        :model-value="fields"
        :group="{ name: 'form-elements', pull: 'clone', put: false }"
        :sort="false"
        :clone="clone"
        class="row g-1"
        @start="onDragStart"
        @end="onDragEnd"
    >
        <div v-for="field in fields" :key="field.id" class="col-6">
            <PaletteItem
                :field="field"
                @click="emit('fieldClick', field.id)"
            />
        </div>
    </VueDraggable>
</template>
