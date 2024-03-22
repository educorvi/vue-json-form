<template>
    <div :class="cssClass">
        <component :is="FormFieldWrapper" :label="label" :label-for="control_id_string">
            <component :is="controlType" />
        </component>
    </div>
</template>

<script setup lang="ts">
import type { Control } from '@/typings/ui-schema';
import { storeToRefs } from 'pinia';
import { getComponent, useFormStructureStore } from '@/stores/formStructure';
import { computed, provide } from 'vue';
import jsonPointer from 'json-pointer';
import { layoutProviderKey, jsonElementProviderKey } from '@/components/ProviderKeys';
import { computedLabel } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computedCssClass } from '@/computedProperties/css';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';
import { isTagsConfig } from '@/components/LayoutElements/Control/optionsParser';

const { jsonSchema } = storeToRefs(useFormStructureStore());

const FormFieldWrapper = getComponent('FormFieldWrapper');

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Control;
}>();

const control_id_string = controlID(props.layoutElement);

let additionalHiddenClass = props.layoutElement.options?.hidden ? 'hiddenControl' : '';

const cssClass = computedCssClass(props.layoutElement, 'vjf_control', additionalHiddenClass);

const jsonElement = computed(
    () => jsonPointer.get(jsonSchema.value || {}, props.layoutElement.scope) as CoreSchemaMetaSchema
);

provide(layoutProviderKey, props.layoutElement);
provide(jsonElementProviderKey, jsonElement.value);

const label = computedLabel(props.layoutElement);

/**
 * The type of the control
 */
const controlType = computed(() => {
    /**
     * Display enums as Radiobuttons or Select
     */
    if (jsonElement.value.enum !== undefined && jsonElement.value.type !== 'array') {
        if (props.layoutElement.options?.radiobuttons || props.layoutElement.options?.buttons) {
            return getComponent('RadiobuttonControl');
        } else {
            return getComponent('SelectControl');
        }
    }

    /**
     * Display arrays with item enums as CheckboxGroup
     */
    if (
        typeof jsonElement.value.items === 'object' &&
        'enum' in jsonElement.value.items &&
        jsonElement.value.type === 'array'
    ) {
        return getComponent('CheckboxGroupControl');
    }

    /**
     * Display arrays as Tags if enabled
     */
    if (
        jsonElement.value.type === 'array' &&
        isTagsConfig(props.layoutElement.options) &&
        props.layoutElement.options?.tags?.enabled
    ) {
        return getComponent('TagsControl');
    }

    /**
     * Display strings with format uri as FileControl
     */
    if (jsonElement.value.type === 'string' && jsonElement.value.format === 'uri') {
        return getComponent('FileControl');
    }

    /**
     * Display strings with format datetime as DateTimeControl
     */
    if (jsonElement.value.type === 'string' && jsonElement.value.format === 'date-time') {
        return getComponent('DateTimeControl');
    }

    switch (jsonElement.value.type) {
        case 'boolean':
            return getComponent('CheckboxControl');
        case 'number':
        case 'integer':
            return getComponent('NumberControl');
        case 'object':
            return getComponent('ObjectControl');
        case 'string':
            return getComponent('StringControl');
        case 'array':
            return getComponent('ArrayControl');
        default:
            return getComponent('DefaultControl');
    }
});
</script>

<style>
.hiddenControl {
    display: none;
}
</style>
