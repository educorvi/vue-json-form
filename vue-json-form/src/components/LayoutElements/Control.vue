<template>
    <div :class="cssClass" v-if="!invalidJsonPointer">
        <html-renderer
            v-if="htmlMessages.pre"
            :layout-element="htmlMessages.pre"
        />
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
                :required="required || inArrayItem"
                :style="style"
            />
            <template #append v-if="$slots.append">
                <slot name="append" />
            </template>
        </component>
        <html-renderer
            v-if="htmlMessages.post"
            :layout-element="htmlMessages.post"
        />
    </div>
    <div v-else>
        <error-viewer header="Error">
            Invalid Json Pointer: {{ invalidJsonPointer }}
        </error-viewer>
    </div>
</template>

<script setup lang="ts">
import type {
    Control,
    DescendantControlOverrides,
    JSONSchema,
} from '@educorvi/vue-json-form-schemas';
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
    toRef,
    type Ref,
} from 'vue';
import {
    savePathProviderKey,
    savePathOverrideProviderKey,
    mergeDescendantControlOptionsOverrides,
    setDescendantControlOverrides,
    formStructureProviderKey,
    descendantControlOverridesProviderKey,
} from '@/components/ProviderKeys';
import {
    computedLabel,
    getComputedJsonElement,
    getComputedRequired,
} from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computedCssClass } from '@/computedProperties/css';
import type { HTMLRenderer } from '@educorvi/vue-json-form-schemas';

import {
    hasItems,
    isMapperFunctionWithoutData,
    isTagsConfig,
} from '@/typings/typeValidators';
import { useFormDataStore } from '@/stores/formData';
import HtmlRenderer from '@/components/LayoutElements/htmlRenderer.vue';
import {
    computedWithControl,
    useThrottleFn,
    watchDeep,
    watchThrottled,
} from '@vueuse/core';
import { diffChars, diffJson, diffLines } from 'diff';

const { jsonSchema, mappers, arrays, uiSchema } = storeToRefs(
    useFormStructureStore()
);

const FormFieldWrapper = getComponent('FormFieldWrapper');
const ErrorViewer = getComponent('ErrorViewer');

const props = defineProps<{
    /** The UI Schema of this Element */
    layoutElement: Control;

    /** Is this control in an array item */
    inArrayItem?: boolean;
}>();

const jsonElement = getComputedJsonElement(props.layoutElement.scope);

const { formData, defaultFormData, cleanedFormData } =
    storeToRefs(useFormDataStore());

const invalidJsonPointer = ref(false as false | string);

setDescendantControlOverrides(
    props.layoutElement.options?.descendantControlOverrides
);

const overridesMap: DescendantControlOverrides | undefined = inject(
    descendantControlOverridesProviderKey
);

// const formStructureMapped: Ref<{
//     jsonElement: JSONSchema;
//     uiElement: Control;
// }> = ref({
//     jsonElement: {},
//     uiElement: {
//         type: 'Control',
//         scope: '',
//     },
// });

// const updateFormStructureMapped = useThrottleFn(() => {
//     let localJsonElement = JSON.parse(JSON.stringify(jsonElement.value || {}));
//     let localUiElement: Control = JSON.parse(
//         JSON.stringify(props.layoutElement)
//     );
//     for (const mapper of mappers.value) {
//         let mapped;
//         if (isMapperFunctionWithoutData(mapper)) {
//             mapped = mapper(localJsonElement || {}, localUiElement);
//         } else {
//             mapped = mapper(
//                 localJsonElement || {},
//                 localUiElement,
//                 jsonSchema.value,
//                 uiSchema.value,
//                 cleanedFormData.value
//             );
//         }
//         if (mapped) {
//             localJsonElement = mapped.jsonElement;
//             localUiElement = mapped.uiElement;
//         } else {
//             console.warn('Mapper failed', mapper);
//         }
//     }
//     localUiElement = mergeDescendantControlOptionsOverrides(
//         localUiElement,
//         overridesMap
//     );
//     formStructureMapped.value = {
//         jsonElement: localJsonElement,
//         uiElement: localUiElement,
//     };
// }, 200);

const formStructureMapped = computedWithControl(
    [() => jsonElement.value, () => props.layoutElement],
    () => {
        let localJsonElement = jsonElement.value || {};
        let localUiElement: Control = props.layoutElement;
        for (const mapper of mappers.value) {
            let mapped;
            if (isMapperFunctionWithoutData(mapper)) {
                mapped = mapper(localJsonElement || {}, localUiElement);
            } else {
                mapped = mapper(
                    localJsonElement || {},
                    localUiElement,
                    jsonSchema.value,
                    uiSchema.value,
                    cleanedFormData.value
                );
            }
            if (mapped) {
                localJsonElement = mapped.jsonElement;
                localUiElement = mapped.uiElement;
            } else {
                console.warn('Mapper failed', mapper);
            }
        }
        localUiElement = mergeDescendantControlOptionsOverrides(
            localUiElement,
            overridesMap
        );
        return {
            jsonElement: localJsonElement,
            uiElement: localUiElement,
        };
    }
);

watchThrottled(
    () => formData,
    (newVal, oldVal) => {
        console.log(diffChars(JSON.stringify(oldVal), JSON.stringify(newVal)));
        formStructureMapped.trigger();
    },
    { throttle: 100, deep: true }
);

const htmlMessages = computed(() => {
    const messages: { pre?: HTMLRenderer; post?: HTMLRenderer } = {};
    const layoutElement = formStructureMapped.value.uiElement;
    if (layoutElement.options?.preHtml) {
        messages.pre = {
            type: 'HTML',
            htmlData: layoutElement.options.preHtml,
        };
    }
    if (layoutElement.options?.postHtml) {
        messages.post = {
            type: 'HTML',
            htmlData: layoutElement.options.postHtml,
        };
    }

    return messages;
});

const required = getComputedRequired(ref(formStructureMapped.value.uiElement));

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
    'vjf_control mb-3',
    additionalHiddenClass
);

const savePath =
    inject(savePathOverrideProviderKey, undefined) ||
    formStructureMapped.value.uiElement.scope;

provide(formStructureProviderKey, formStructureMapped);
provide(savePathProviderKey, savePath);
provide(savePathOverrideProviderKey, undefined);

const control_id_string = controlID(savePath);

const label = computedLabel(toRef(() => formStructureMapped.value.uiElement));

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
            getOption(formStructureMapped.value.uiElement, 'displayAs') ===
                'radiobuttons' ||
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

    /**
     * Display an array of file uploads as multiple file upload if options is set
     */
    if (
        formStructureMapped.value.jsonElement?.type === 'array' &&
        hasItems(formStructureMapped.value.jsonElement) &&
        formStructureMapped.value.jsonElement.items.type === 'string' &&
        formStructureMapped.value.jsonElement.items.format === 'uri' &&
        formStructureMapped.value.uiElement.options?.displayAsSingleUploadField
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
    // formData.value[savePath] = undefined;
});
</script>

<style>
.hiddenControl {
    display: none;
}
</style>
