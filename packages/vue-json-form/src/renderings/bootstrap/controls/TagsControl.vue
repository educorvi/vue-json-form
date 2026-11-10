<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { controlID } from '@/computedProperties/misc';
import { BFormTags } from 'bootstrap-vue-next';

import { hasOption } from '@/typings/typeValidators';
import { getStores, injectJsonData } from '@/computedProperties/json.ts';

const { formDataStore } = getStores();
const { formData } = storeToRefs(formDataStore);

const { layoutElement, savePath } = injectJsonData();
const id = controlID(savePath);
</script>

<template>
    <b-form-tags
        :id="id"
        v-model="formData[savePath]"
        variant
        separator=" "
        class="vjf_tags"
        :tag-pills="
            hasOption(layoutElement, 'tags') &&
            layoutElement.options?.tags?.pills
        "
        :tag-variant="
            hasOption(layoutElement, 'tags')
                ? layoutElement.options?.tags?.variant
                : undefined
        "
    />
</template>

<style>
.b-form-tags .b-form-tag {
    margin-left: 4px;
    margin-right: 4px;
}
</style>
