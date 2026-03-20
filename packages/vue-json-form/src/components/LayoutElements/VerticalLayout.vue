<script setup lang="ts">
import type { Layout } from '@educorvi/vue-json-form-schemas';
import FormWrap from '@/components/FormWrap.vue';
import { computedCssClass } from '@/computedProperties/css';
import { computed } from 'vue';
import { hasElements } from '@/typings/typeValidators';
import { mapUUID } from '@/Commons';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Layout;
}>();

const cssClass = computedCssClass(props.layoutElement, 'vjf_verticalLayout');
const elementsWithUUID = computed(() => {
    if (!hasElements(props.layoutElement)) return [];
    return mapUUID(props.layoutElement.elements);
});
</script>

<template>
    <div :class="cssClass">
        <form-wrap
            v-for="element in elementsWithUUID"
            :key="element.uuid"
            :layout-element="element"
        />
    </div>
</template>

<style scoped></style>
