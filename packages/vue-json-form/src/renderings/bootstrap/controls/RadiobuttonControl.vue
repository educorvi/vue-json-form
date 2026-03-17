<script setup lang="ts">
import { BFormRadioGroup, type CheckboxOptionRaw } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import {
    hasOption,
    hasProperty,
    isEnumButtonsConfig,
} from '@/typings/typeValidators';
import { computed, type ComputedRef, watch } from 'vue';
import { getOption } from '@/utilities';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';

const { formDataStore } = getStores();

const { formData } = storeToRefs(formDataStore);
const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);
const options: ComputedRef<CheckboxOptionRaw[]> = computed(() => {
    if (
        !hasProperty(jsonElement.value, 'enum') ||
        !Array.isArray(jsonElement.value.enum)
    ) {
        return [];
    }
    return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jsonElement.value.enum.map((key: any) => {
            const textVals =
                (hasOption(layoutElement.value, 'enumTitles') &&
                    layoutElement.value.options.enumTitles) ||
                {};
            const text = textVals[key] || key;
            return { value: key, text };
        }) || []
    );
});

const displaySettings = computed(() => {
    const stacked: boolean = getOption(layoutElement.value, 'stacked', false);
    if (isEnumButtonsConfig(layoutElement.value.options)) {
        return {
            displayAs: 'buttons',
            buttonVariant: getOption(
                layoutElement.value,
                'buttonVariant',
                'primary'
            ),
            stacked,
        };
    }
    return { stacked };
});

watch(
    () => jsonElement.value.enum,
    () => {
        if (
            jsonElement.value.enum &&
            !jsonElement.value.enum.includes(formData.value[savePath])
        ) {
            formData.value[savePath] = undefined;
        }
    }
);
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

<style scoped>
.vjf_radioGroup {
    position: relative;
    display: block;
}
</style>
