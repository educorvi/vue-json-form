<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import { injectJsonData } from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { BFormTags } from 'bootstrap-vue-next';

import { isTagsConfig } from '@/typings/typeValidators';

const { formData } = storeToRefs(useFormDataStore());

const { layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);
</script>

<template>
    <b-form-tags
        variant
        v-model="formData[savePath]"
        separator=" "
        :id="id"
        class="vjf_tags"
        :tagPills="isTagsConfig(layoutElement.options) && layoutElement.options?.tags?.pills"
        :tagVariant="isTagsConfig(layoutElement.options) && layoutElement.options?.tags?.variant"
    />
</template>

<style>
.b-form-tags .b-form-tag {
    margin-left: 4px;
    margin-right: 4px;
}
</style>
