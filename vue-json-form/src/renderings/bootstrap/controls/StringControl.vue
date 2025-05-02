<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { bootstrapComponents } from '@/renderings/bootstrap/BootstrapComponents';
import { BFormInput, BFormTextarea, type InputType } from 'bootstrap-vue-next';
import { computed, type Ref } from 'vue';
import type { InputOptions } from '@/typings/ui-schema';
import { isInputType } from '@/typings/typeValidators';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, jsonElement, savePath } = injectJsonData();
const id = controlID(savePath);

const type: Ref<InputType | undefined> = computed(() => {
    const str =
        (layoutElement.options as undefined | InputOptions)?.format ||
        jsonElement.format?.replace('date-time', 'datetime-local');
    if (!isInputType(str)) {
        return undefined;
    }
    return str;
});
</script>

<template>
    <BFormTextarea
        v-if="(layoutElement.options as InputOptions | undefined)?.multi"
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
    />
</template>

<style scoped></style>
