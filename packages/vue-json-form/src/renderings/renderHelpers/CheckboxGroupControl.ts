import {
    hasEnumValuesForItems,
    isNotNullOrUndefined,
} from '@/typings/typeValidators.ts';
import { computed, inject, onMounted, ref, type Ref, watch } from 'vue';
import type { Control, JSONSchema } from '@educorvi/vue-json-form-schemas';
import { getOption } from '@/renderings/renderHelpers/utilities.ts';
import type { CheckboxValue } from 'bootstrap-vue-next';
import { getArrayItemSavePath, isArrayItemKey } from '@/Commons.ts';
import { storeToRefs } from 'pinia';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import { validateCheckboxGroupInput } from '@/formControlInputValidation';
import { languageProviderKey } from '@/components/ProviderKeys.ts';

/**
 * Returns a computed ref of the option list for a checkbox-group control.
 *
 * Each entry in `jsonElement.items.enum` is mapped to a `{ value, text }`
 * object. When `options.enumTitles` is provided in the layout element, the
 * corresponding title is used as the display text; otherwise the raw enum
 * value is stringified and used directly.
 *
 * Returns an empty array when the schema has no items enum.
 *
 * @param jsonElement - Readonly ref to the JSON Schema element. Must have
 *   `items.enum` for options to be non-empty.
 * @param layoutElement - Readonly ref to the UI schema control element.
 * @returns A computed ref of `{ value, text }` option objects.
 */
export function getOptions(
    jsonElement: Readonly<Ref<JSONSchema>>,
    layoutElement: Readonly<Ref<Control>>
) {
    return computed(() => {
        if (!hasEnumValuesForItems(jsonElement.value)) {
            return [];
        } else {
            return (
                jsonElement.value.items.enum.map((key) => {
                    const textVals =
                        getOption(layoutElement.value, 'enumTitles') || {};
                    const text = textVals[key] || key;
                    return { value: key, text: String(text) };
                }) || []
            );
        }
    });
}

function setupValidation(values: Ref<CheckboxValue[]>, required: boolean) {
    const valid = ref(true);
    const { jsonElement, savePath } = injectJsonData();
    const { formDataStore, formStructureStore } = getStores();
    const { formData } = storeToRefs(formDataStore);
    const { formStateWasValidated } = storeToRefs(formStructureStore);
    const languageProvider = inject(languageProviderKey);
    const validate = () => {
        valid.value = validateCheckboxGroupInput(
            required,
            values.value,
            jsonElement.value,
            savePath,
            languageProvider
        );
    };

    watch(values, (newVal) => {
        validate();
        if (!hasEnumValuesForItems(jsonElement.value)) return;
        formData.value[savePath] = jsonElement.value.items.enum.filter((e) =>
            newVal.includes(e)
        );
    });

    onMounted(validate);

    return computed(() => {
        if (formStateWasValidated.value) {
            return valid.value;
        } else {
            return undefined;
        }
    });
}

export function setupValuesAndValidation(required: boolean) {
    const { formDataStore } = getStores();
    const { formData } = storeToRefs(formDataStore);
    const values = ref<CheckboxValue[]>([]);
    const { savePath } = injectJsonData();

    // Convert array item keys to local items if loaded (for example with presetData)
    watch(
        () => formData.value[savePath],
        (newVal) => {
            let presetValues: CheckboxValue[] | undefined;
            if (isNotNullOrUndefined(newVal) && Array.isArray(newVal)) {
                presetValues = newVal?.map((item) => {
                    if (!isArrayItemKey(item)) {
                        return item;
                    }
                    return formData.value[getArrayItemSavePath(savePath, item)];
                });
                if (
                    JSON.stringify(presetValues) !==
                    JSON.stringify(values.value)
                ) {
                    values.value = presetValues as CheckboxValue[];
                }
            }
        },
        { immediate: true }
    );

    const state = setupValidation(values, required);
    return { values, state };
}
