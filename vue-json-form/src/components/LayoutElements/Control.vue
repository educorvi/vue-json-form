<template>
    <div :class="cssClass" v-if="!invalidJsonPointer">
        <component
            :is="FormFieldWrapper"
            :label="label"
            :label-for="control_id_string"
        >
            <template #prepend v-if="$slots.prepend">
                <slot name="prepend" />
            </template>
            <component
                :is="controlType"
                :name="formStructureMapped.uiElement.scope"
                :disabled="formStructureMapped.uiElement.options?.disabled"
                :placeholder="
                    formStructureMapped.uiElement.options?.placeholder
                "
                :autocomplete="
                    getOption(
                        formStructureMapped.uiElement,
                        'autocomplete',
                        'on'
                    )
                "
                :required="required"
                :style="style"
            />
            <template #append v-if="$slots.append">
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
import { getOption } from '@/utilities';
import {
    computed,
    inject,
    onBeforeUnmount,
    onMounted,
    provide,
    ref,
    type ComputedRef,
    watch,
} from 'vue';
import jsonPointer from 'json-pointer';
import {
    layoutProviderKey,
    jsonElementProviderKey,
    savePathProviderKey,
    savePathOverrideProviderKey,
    mergeDescendantControlOptionsOverrides,
    descendantControlOverridesProviderKey,
    setDescendantControlOverride,
    setDescendantControlOverrides,
} from '@/components/ProviderKeys';
import {
    computedLabel,
    getComputedJsonElement,
    getComputedRequired,
} from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computedCssClass } from '@/computedProperties/css';
import type { CoreSchemaMetaSchema } from '@/typings/json-schema';

import { hasOption, isInputType, isTagsConfig } from '@/typings/typeValidators';
import { useFormDataStore } from '@/stores/formData';

const { jsonSchema, mappers, arrays } = storeToRefs(useFormStructureStore());

const FormFieldWrapper = getComponent('FormFieldWrapper');
const ErrorViewer = getComponent('ErrorViewer');

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Control;
}>();

const jsonElement = getComputedJsonElement(props.layoutElement.scope);

const { formData, defaultFormData } = storeToRefs(useFormDataStore());

const invalidJsonPointer = ref(false as false | string);

setDescendantControlOverrides(
    props.layoutElement.options?.descendantControlOverrides
);

const formStructureMapped = computed(() => {
    let localJsonElement = jsonElement.value;
    let localUiElement: Control = props.layoutElement;
    for (const mapper of mappers.value) {
        const mapped = mapper(localJsonElement || {}, localUiElement);
        if (mapped) {
            localJsonElement = mapped.jsonElement;
            localUiElement = mapped.uiElement;
        } else {
            console.warn('Mapper failed', mapper);
        }
    }
    localUiElement = mergeDescendantControlOptionsOverrides(localUiElement);
    return {
        jsonElement: localJsonElement,
        uiElement: localUiElement,
    };
});

const required = getComputedRequired(formStructureMapped.value.uiElement);

let additionalHiddenClass = formStructureMapped.value.uiElement.options?.hidden
    ? 'hiddenControl'
    : '';

const style = computed(() => {
    if (
        props.layoutElement.options &&
        'textAlign' in props.layoutElement.options &&
        props.layoutElement.options.textAlign
    ) {
        return `text-align: ${props.layoutElement.options.textAlign}`;
    }
    return undefined;
});

const cssClass = computedCssClass(
    formStructureMapped.value.uiElement,
    'vjf_control mb-3 w-100',
    additionalHiddenClass
);

const savePath =
    inject(savePathOverrideProviderKey, undefined) ||
    formStructureMapped.value.uiElement.scope;

provide(layoutProviderKey, formStructureMapped.value.uiElement);
provide(jsonElementProviderKey, formStructureMapped.value.jsonElement || {});
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
        formStructureMapped.value.jsonElement?.enum !== undefined &&
        formStructureMapped.value.jsonElement.type !== 'array'
    ) {
        if (
            (getOption(formStructureMapped.value.uiElement, 'displayAs') === 'radiobuttons') ||
            getOption(formStructureMapped.value.uiElement, 'displayAs') ===
                'buttons'
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
        typeof formStructureMapped.value.jsonElement?.items === 'object' &&
        'enum' in formStructureMapped.value.jsonElement.items &&
        formStructureMapped.value.jsonElement.type === 'array'
    ) {
        return getComponent('CheckboxGroupControl');
    }

    /**
     * Display arrays as Tags if enabled
     */
    if (
        formStructureMapped.value.jsonElement?.type === 'array' &&
        isTagsConfig(formStructureMapped.value.uiElement.options) &&
        formStructureMapped.value.uiElement.options?.tags?.enabled
    ) {
        return getComponent('TagsControl');
    }

    /**
     * Display strings with format uri as FileControl
     */
    if (
        formStructureMapped.value.jsonElement?.type === 'string' &&
        formStructureMapped.value.jsonElement.format === 'uri'
    ) {
        return getComponent('FileControl');
    }

    switch (formStructureMapped.value.jsonElement?.type) {
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

watch(jsonElement, () => {
    if (jsonElement.value === undefined) {
        invalidJsonPointer.value = props.layoutElement.scope;
    }
});

onMounted(() => {
    // Coalescing is needed because if this field is an array item, the value is set by ArrayControl due to
    // the computed scope
    formData.value[savePath] =
        defaultFormData.value[savePath] ?? formData.value[savePath];
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
