<script setup lang="ts">
import { BFormSelect } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { controlID } from '@/computedProperties/misc';
import { computed, inject, toRef, toRefs } from 'vue';
import {
    allDefined,
    hasEnumTitlesOptions,
    isDefined,
} from '@/typings/typeValidators';
import type { TitlesForEnum } from '@educorvi/vue-json-form-schemas';
import { injectJsonData } from '@/computedProperties/json.ts';

const { formData } = storeToRefs(useFormDataStore());

const { jsonElement, layoutElement, savePath } = injectJsonData();

const id = controlID(savePath);

const options = computed(() => {
    if (!jsonElement.value.enum) {
        return [];
    }
    if (!hasEnumTitlesOptions(layoutElement.value)) {
        return jsonElement.value.enum;
    } else {
        return jsonElement.value.enum.map((value) => {
            if (typeof value !== 'string' && typeof value !== 'number') {
                return value;
            }
            return {
                value,
                text:
                    (layoutElement.value.options?.enumTitles as TitlesForEnum)[
                        value
                    ] || value,
            };
        });
    }
});
</script>

<template>
    <BFormSelect
        v-model="formData[savePath]"
        :options="options"
        class="vjf_select"
        :id="id"
    />
</template>

<style scoped></style>
