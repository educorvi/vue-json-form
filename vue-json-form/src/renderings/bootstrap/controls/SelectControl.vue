<script setup lang="ts">
import { BFormSelect } from 'bootstrap-vue-next';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { computed } from 'vue';
import { hasEnumTitlesOptions } from '@/typings/typeValidators';
import type { TitlesForEnum } from '@educorvi/vue-json-forn-schemas';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);

const options = computed(() => {
    if (!jsonElement.enum) {
        return [];
    }
    if (!hasEnumTitlesOptions(layoutElement)) {
        return jsonElement.enum;
    } else {
        return jsonElement.enum.map((value) => {
            if (typeof value !== 'string' && typeof value !== 'number') {
                return value;
            }
            return {
                value,
                text:
                    (layoutElement.options.enumTitles as TitlesForEnum)[
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
