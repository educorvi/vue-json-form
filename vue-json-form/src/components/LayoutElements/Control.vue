<template>
    <div :class="cssClass" v-if="!invalidJsonPointer">
        <component
            :is="FormFieldWrapper"
            :label="label"
            :label-for="control_id_string"
        >
            <template #prepend>
                <slot name="prepend" />
            </template>
            <component
                :is="controlType"
                :name="layoutElement.scope"
                :disabled="layoutElement.options?.disabled"
                :placeholder="layoutElement.options?.placeholder"
                :autocomplete="layoutElement.options?.autocomplete || 'on'"
                :type="layoutElement.options?.format"
                :required="required"
            />
            <template #append>
                <slot name="append" />
            </template>
        </component>
    </div>
    <div v-else>
        <error-viewer header="Error">
            Invalid Json Pointer: {{ invalidJsonPointer }}
        </error-viewer>
    </div>
</template>

<script setup lang="ts">
import type { Control } from '@/typings/ui-schema';
import { storeToRefs } from 'pinia';
import { getComponent, useFormStructureStore } from '@/stores/formStructure';
import {
    computed,
    inject,
    onBeforeUnmount,
    onMounted,
    provide,
    ref,
    type ComputedRef,
} from 'vue';
import jsonPointer from 'json-pointer';
import {
    layoutProviderKey,
    jsonElementProviderKey,
    savePathProviderKey,
    savePathOverrideProviderKey,
} from '@/components/ProviderKeys';
import { computedLabel, computedRequired } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computedCssClass } from '@/computedProperties/css';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';

import { isTagsConfig } from '@/typings/typeValidators';
import { useFormDataStore } from '@/stores/formData';

const { jsonSchema, mappers } = storeToRefs(useFormStructureStore());

const FormFieldWrapper = getComponent('FormFieldWrapper');
const ErrorViewer = getComponent('ErrorViewer');

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Control;
}>();

const { formData, defaultFormData } = storeToRefs(useFormDataStore());

const invalidJsonPointer = ref(false as false | string);

const jsonElement: ComputedRef<CoreSchemaMetaSchema> = computed(() => {
    try {
        return jsonPointer.get(
            jsonSchema.value || {},
            props.layoutElement.scope
        ) as CoreSchemaMetaSchema;
    } catch (e) {
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        invalidJsonPointer.value = props.layoutElement.scope;
        return {};
    }
});

const formStructureMapped = computed(() => {
    let localJsonElement = jsonElement.value;
    let localUiElement = props.layoutElement;
    for (const mapper of mappers.value) {
        const mapped = mapper(localJsonElement, localUiElement);
        if (mapped) {
            localJsonElement = mapped.jsonElement;
            localUiElement = mapped.uiElement;
        } else {
            console.warn('Mapper failed', mapper);
        }
    }
    return {
        jsonElement: localJsonElement,
        uiElement: localUiElement,
    };
});

const required = computedRequired(formStructureMapped.value.uiElement);

let additionalHiddenClass = formStructureMapped.value.uiElement.options?.hidden
    ? 'hiddenControl'
    : '';

const cssClass = computedCssClass(
    formStructureMapped.value.uiElement,
    'vjf_control mb-3 w-100',
    additionalHiddenClass
);

const savePath =
    inject(savePathOverrideProviderKey, undefined) ||
    formStructureMapped.value.uiElement.scope;

provide(layoutProviderKey, formStructureMapped.value.uiElement);
provide(jsonElementProviderKey, formStructureMapped.value.jsonElement);
provide(savePathProviderKey, savePath);
provide(savePathOverrideProviderKey, undefined);

const control_id_string = controlID(savePath);

const label = computedLabel(formStructureMapped.value.uiElement);

/**
 * The type of the control
 */
const controlType = computed(() => {
    /**
     * Display enums as Radiobuttons or Select
     */
    if (
        formStructureMapped.value.jsonElement.enum !== undefined &&
        formStructureMapped.value.jsonElement.type !== 'array'
    ) {
        if (
            formStructureMapped.value.uiElement.options?.displayAs ===
                'radiobuttons' ||
            formStructureMapped.value.uiElement.options?.displayAs === 'buttons'
        ) {
            return getComponent('RadiobuttonControl');
        } else {
            return getComponent('SelectControl');
        }
    }

    /**
     * Display arrays with item enums as CheckboxGroup
     */
    if (
        typeof formStructureMapped.value.jsonElement.items === 'object' &&
        'enum' in formStructureMapped.value.jsonElement.items &&
        formStructureMapped.value.jsonElement.type === 'array'
    ) {
        return getComponent('CheckboxGroupControl');
    }

    /**
     * Display arrays as Tags if enabled
     */
    if (
        formStructureMapped.value.jsonElement.type === 'array' &&
        isTagsConfig(formStructureMapped.value.uiElement.options) &&
        formStructureMapped.value.uiElement.options?.tags?.enabled
    ) {
        return getComponent('TagsControl');
    }

    /**
     * Display strings with format uri as FileControl
     */
    if (
        formStructureMapped.value.jsonElement.type === 'string' &&
        formStructureMapped.value.jsonElement.format === 'uri'
    ) {
        return getComponent('FileControl');
    }

    switch (formStructureMapped.value.jsonElement.type) {
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

onMounted(() => {
    formData.value[savePath] = defaultFormData.value[savePath];
});

onBeforeUnmount(() => {
    formData.value[savePath] = undefined;
});
</script>

<style>
.hiddenControl {
    display: none;
}
</style>
