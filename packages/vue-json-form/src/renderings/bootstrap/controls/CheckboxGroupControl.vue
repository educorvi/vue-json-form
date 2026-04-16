<script setup lang="ts">
import { BFormCheckboxGroup, type CheckboxOption } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import {
    hasEnumValuesForItems,
    isNotNullOrUndefined,
} from '@/typings/typeValidators';
import { getOption } from '@/renderings/renderHelpers/utilities.ts';
import { computed, type ComputedRef, inject, onMounted, ref, watch } from 'vue';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';
import { validateCheckboxGroupInput } from '@/formControlInputValidation/CheckboxGroupValidation.ts';
import { languageProviderKey } from '@/components/ProviderKeys.ts';
import { CheckboxGroupControl } from '@/renderings/renderHelpers';
import { getArrayItemSavePath, isArrayItemKey } from '@/Commons.ts';
const { formDataStore, formStructureStore } = getStores();
// accept prop so it does not overwrite the required=false below
const props = defineProps<{
    required?: boolean;
}>();

const { formData, cleanedFormData } = storeToRefs(formDataStore);

const { formStateWasValidated } = storeToRefs(formStructureStore);

const languageProvider = inject(languageProviderKey);

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

let options: ComputedRef<CheckboxOption[]> = CheckboxGroupControl.getOptions(
    jsonElement,
    layoutElement
);

const valid = ref(true);

// this is done because v-model writes the values in the order they are clicked, not the order they are defined in the schema
const values = ref<any[]>([]);

const validate = () => {
    valid.value = validateCheckboxGroupInput(
        props.required,
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

watch(
    () => formData.value[savePath],
    (newVal) => {
        let presetValues: unknown[] | undefined;
        if (isNotNullOrUndefined(newVal)) {
            presetValues = newVal;
            presetValues = presetValues?.map((item) => {
                if (!isArrayItemKey(item)) {
                    return item;
                }
                return formData.value[getArrayItemSavePath(savePath, item)];
            });
            if (JSON.stringify(presetValues) !== JSON.stringify(values.value)) {
                values.value = presetValues as any[];
            }
        }
    },
    { immediate: true }
);

const state = computed(() => {
    if (formStateWasValidated.value) {
        return valid.value;
    } else {
        return undefined;
    }
});
</script>

<template>
    <BFormCheckboxGroup
        :id="id"
        v-model="values"
        :options="options"
        class="vjf_checkboxGroup"
        :required="false"
        :state="state"
        :stacked="getOption(layoutElement, 'stacked')"
        :buttons="getOption(layoutElement, 'displayAs') === 'buttons'"
        :switches="getOption(layoutElement, 'displayAs') === 'switches'"
        :button-variant="getOption(layoutElement, 'buttonVariant') || 'primary'"
    />
</template>

<style scoped></style>
