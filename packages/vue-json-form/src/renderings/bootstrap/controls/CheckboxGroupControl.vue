<script setup lang="ts">
import { BFormCheckboxGroup, type CheckboxOption } from 'bootstrap-vue-next';
import { controlID } from '@/computedProperties/misc';

import { getOption } from '@/renderings/renderHelpers/utilities.ts';
import { type ComputedRef } from 'vue';
import { injectJsonData } from '@/computedProperties/json.ts';
import { CheckboxGroupControl } from '@/renderings/renderHelpers';
import { setupValuesAndValidation } from '@/renderings/renderHelpers/CheckboxGroupControl.ts';
// accept prop so it does not overwrite the required=false below
const props = defineProps<{
    required?: boolean;
}>();

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

let options: ComputedRef<CheckboxOption[]> = CheckboxGroupControl.getOptions(
    jsonElement,
    layoutElement
);

// values are not written to store directly because v-model writes the values in the order they are clicked, not the order they are defined in the schema
const { values, state } = setupValuesAndValidation(props.required);
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
