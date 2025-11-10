<script setup lang="ts">
import {
    BFormCheckboxGroup,
    type ButtonVariant,
    type CheckboxOption,
} from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { controlID } from '@/computedProperties/misc';
import { hasEnumValuesForItems, isDefined } from '@/typings/typeValidators';
import { getOption } from '@/utilities';
import type { ColorVariants } from '@educorvi/vue-json-form-schemas';
import { computed, type ComputedRef, inject, toRefs } from 'vue';
import { injectJsonData } from '@/computedProperties/json.ts';

const { formData } = storeToRefs(useFormDataStore());

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

let options: ComputedRef<CheckboxOption[]> = computed(() => {
    if (!hasEnumValuesForItems(jsonElement.value)) {
        return [];
    } else {
        return (
            jsonElement.value.items?.enum?.map((key) => {
                const textVals: Record<any, any> =
                    getOption(layoutElement.value, 'enumTitles') || {};
                const text = textVals[key] || key;
                return { value: key, text };
            }) || []
        );
    }
});
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
            getOption<ColorVariants>(layoutElement, 'buttonVariant') ||
            'primary'
        "
    />
</template>

<style scoped></style>
