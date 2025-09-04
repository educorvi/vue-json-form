<script setup lang="ts">
import type { Layout } from '@educorvi/vue-json-form-schemas';
import VerticalLayout from '@/components/LayoutElements/VerticalLayout.vue';
import { computedCssClass } from '@/computedProperties/css';
import { getComponent } from '@/stores/formStructure.ts';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Layout;
}>();

const cssClass = computedCssClass(props.layoutElement, 'vjf_group');

const HelpPopover = getComponent('HelpPopover');
</script>

<template>
    <fieldset :class="cssClass">
        <legend v-show="layoutElement.options?.label">
            {{ layoutElement.options?.label || 'Unnamed group' }}
            <span style="font-size: 1rem">
                <component :is="HelpPopover" />
            </span>
        </legend>
        <vertical-layout
            class="vjf_fieldset-content"
            :layout-element="{ ...layoutElement, type: 'VerticalLayout' }"
        />
    </fieldset>
</template>

<style scoped lang="scss">
legend {
    display: flex;
    align-items: center;
}
</style>
