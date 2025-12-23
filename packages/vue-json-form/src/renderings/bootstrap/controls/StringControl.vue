<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { controlID } from '@/computedProperties/misc';
import { BFormInput, BFormTextarea, type InputType } from 'bootstrap-vue-next';
import { computed, type ComputedRef, type Ref } from 'vue';
import type {
    ControlFormattingOptions,
    InputOptions,
} from '@educorvi/vue-json-form-schemas';
import { isInputType } from '@/typings/typeValidators';
import { injectJsonData } from '@/computedProperties/json.ts';

const { formData } = storeToRefs(useFormDataStore());

const { jsonElement, layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);

const options: ComputedRef<ControlFormattingOptions & InputOptions> = computed(
    () => layoutElement.value.options || {}
);

const type: Ref<InputType | undefined> = computed(() => {
    const str =
        options.value.format ||
        jsonElement.value.format?.replace('date-time', 'datetime-local');
    if (!isInputType(str)) {
        return undefined;
    }
    return str;
});
</script>

<template>
    <BFormTextarea
        v-if="options.multi"
        v-model="formData[savePath]"
        class="vjf_textarea"
        :id="id"
        :minlength="jsonElement.minLength"
        :maxlength="jsonElement.maxLength"
    />
    <b-form-input
        v-else
        v-model="formData[savePath]"
        class="vjf_input"
        :id="id"
        :minlength="jsonElement.minLength"
        :maxlength="jsonElement.maxLength"
        :step="jsonElement.multipleOf"
        :min="jsonElement.minimum"
        :max="jsonElement.maximum"
        :type="type"
        :pattern="jsonElement.pattern"
    />
</template>

<style scoped></style>
