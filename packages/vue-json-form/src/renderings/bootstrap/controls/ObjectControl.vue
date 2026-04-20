<script setup lang="ts">
import { computedLabel, injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computed } from 'vue';
import { generateUISchema } from '@/Commons';
import FormWrap from '@/components/FormWrap.vue';
import { computedCssClass } from '@/computedProperties/css.ts';
import HelpPopover from '@/renderings/bootstrap/HelpPopover.vue';

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
    <fieldset :id="id" :class="cssClass">
        <legend v-if="layoutElement.options?.label !== false && label">
            {{ label }} <span class="vjf_object_help"><HelpPopover /></span>
        </legend>
        <p v-if="jsonElement.description">
            {{ jsonElement.description }}
        </p>
        <div class="vjf_indented">
            <form-wrap
                v-for="element in controlElements"
                :key="element.scope"
                :layout-element="element"
            />
        </div>
    </fieldset>
</template>

<style scoped lang="scss">
legend {
    display: flex;
    align-items: center;
}

.vjf_object_help {
    font-size: 1rem;
    margin-left: 0.25rem;
}
</style>
