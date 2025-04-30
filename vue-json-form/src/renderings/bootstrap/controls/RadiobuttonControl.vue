<script setup lang="ts">
import { BFormRadioGroup } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import {
    hasEnum,
    hasEnumTitlesOptions,
    isEnumButtonsConfig,
} from '@/typings/typeValidators';
import { computed } from 'vue';
import { getOption } from '@/utilities';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);
const options = computed(() => {
    if (!hasEnum(jsonElement)) {
        return [];
    }
    return (
        jsonElement.enum?.map((key: any) => {
            const textVals: Record<any, any> =
                (hasEnumTitlesOptions(layoutElement) &&
                    layoutElement.options.enumTitles) ||
                {};
            const text = textVals[key] || key;
            return { value: key, text };
        }) || []
    );
});

const displaySettings = computed(() => {
    let stacked: boolean = getOption(layoutElement, 'stacked', false);
    if (isEnumButtonsConfig(layoutElement.options)) {
        return {
            displayAs: 'buttons',
            buttonVariant: getOption(layoutElement, 'buttonVariant', 'primary'),
            stacked,
        };
    }
    return { stacked };
});
</script>

<template>
    <BFormRadioGroup
        v-model="formData[savePath]"
        :options="options"
        class="vjf_radioGroup w-100"
        :id="id"
        :buttons="displaySettings.displayAs === 'buttons'"
        :button-variant="displaySettings.buttonVariant || 'primary'"
        :stacked="displaySettings.stacked"
    />
</template>

<style></style>
