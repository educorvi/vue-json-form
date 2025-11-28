<script setup lang="ts">
import { BFormRadioGroup } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { controlID } from '@/computedProperties/misc';
import {
    hasOption,
    hasProperty,
    isEnumButtonsConfig,
} from '@/typings/typeValidators';
import { computed, watch } from 'vue';
import { getOption } from '@/utilities';
import type { ColorVariants } from '@educorvi/vue-json-form-schemas';
import { injectJsonData } from '@/computedProperties/json.ts';

const { formData } = storeToRefs(useFormDataStore());
const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);
const options = computed(() => {
    if (
        !hasProperty(jsonElement.value, 'enum') ||
        !Array.isArray(jsonElement.value.enum)
    ) {
        return [];
    }
    return (
        jsonElement.value.enum.map((key: any) => {
            const textVals: Record<any, any> =
                (hasOption(layoutElement.value, 'enumTitles') &&
                    layoutElement.value.options.enumTitles) ||
                {};
            const text = textVals[key] || key;
            return { value: key, text };
        }) || []
    );
});

const displaySettings = computed(() => {
    let stacked: boolean = getOption(layoutElement.value, 'stacked', false);
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

<style></style>
