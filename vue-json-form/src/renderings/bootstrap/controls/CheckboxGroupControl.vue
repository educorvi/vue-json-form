<script setup lang="ts">
import {
    BFormCheckboxGroup,
    type ButtonVariant,
    type CheckboxOption,
} from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { hasEnumValuesForItems } from '@/typings/typeValidators';
import { getOption } from '@/utilities';
import type { ColorVariant } from '@educorvi/vue-json-form-schemas';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);

let options: CheckboxOption[];
if (!hasEnumValuesForItems(jsonElement)) {
    options = [];
} else {
    options =
        jsonElement.items?.enum?.map((key) => {
            const textVals: Record<any, any> =
                getOption(layoutElement, 'enumTitles') || {};
            const text = textVals[key] || key;
            return { value: key, text };
        }) || [];
}
</script>

<template>
    <BFormCheckboxGroup
        v-model="formData[savePath]"
        :options="options"
        class="vjf_checkboxGroup"
        :id="id"
        :stacked="getOption(layoutElement, 'stacked')"
        :buttons="getOption(layoutElement, 'displayAs') === 'buttons'"
        :switches="getOption(layoutElement, 'displayAs') === 'switches'"
        :button-variant="
            getOption<ColorVariant>(layoutElement, 'buttonVariant') || 'primary'
        "
    />
</template>

<style scoped></style>
