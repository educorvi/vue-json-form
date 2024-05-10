<script setup lang="ts">
import {
    BFormGroup,
    BInputGroup,
    BInputGroupPrepend,
    BInputGroupAppend,
} from 'bootstrap-vue-next';
import { computed } from 'vue';
import { injectJsonData } from '@/computedProperties/json';
import { isTagsConfig } from '@/typings/typeValidators';

const props = defineProps<{
    label: string;
    labelFor: string;
}>();

const { jsonElement, layoutElement } = injectJsonData();
const hideLabel = computed(() => {
    return (
        jsonElement.type === 'boolean' ||
        jsonElement.type === 'object' ||
        layoutElement.options?.label === false ||
        (jsonElement.type === 'array' &&
            !jsonElement.enum &&
            !(
                isTagsConfig(layoutElement.options) &&
                layoutElement.options.tags?.enabled
            ))
    );
});
</script>

<template>
    <BFormGroup
        :label="hideLabel ? '' : props.label"
        :label-for="hideLabel ? '' : props.labelFor"
        :description="jsonElement.description"
    >
        <BInputGroup
            class="w-100"
            :prepend="layoutElement.options?.prepend"
            :append="layoutElement.options?.append"
        >
            <slot />
        </BInputGroup>
    </BFormGroup>
</template>

<style scoped></style>
