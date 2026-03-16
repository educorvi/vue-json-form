<script setup lang="ts">
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computed, onMounted, ref, watch } from 'vue';
import { generateUISchema } from '@/Commons';
import FormWrap from '@/components/FormWrap.vue';
import type { Control, Layout } from '@educorvi/vue-json-form-schemas';
import VerticalLayout from '@/components/LayoutElements/VerticalLayout.vue';
import { computedCssClass } from '@/computedProperties/css.ts';

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);
const cssClass = computedCssClass(layoutElement, 'vjf_object');
const label = computedLabel(layoutElement);

const controlElements = computed(() => {
    const uiSchema = generateUISchema(jsonElement.value, {
        scopeBase: layoutElement.value.scope,
    });
    const elements = uiSchema.layout.elements;
    return elements.filter((element) => element.type === 'Control');
});
</script>

<template>
    <fieldset :class="cssClass" :id="id">
        <legend v-show="label">
            {{ label }}
        </legend>
        <p v-if="jsonElement.description">
            {{ jsonElement.description }}
        </p>
        <div class="vjf_indented">
            <form-wrap
                v-for="element in controlElements"
                :layout-element="element"
                :key="element.scope"
            />
        </div>
    </fieldset>
</template>

<style scoped lang="scss">
legend {
    display: flex;
    align-items: center;
}
</style>
