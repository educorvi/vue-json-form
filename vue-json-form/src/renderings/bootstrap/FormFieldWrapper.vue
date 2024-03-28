<script setup lang="ts">
import { BFormGroup, BInputGroup, BInputGroupPrepend, BInputGroupAppend } from 'bootstrap-vue-next';
import { computed } from 'vue';
import { injectJsonData } from '@/computedProperties/json';

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
        (jsonElement.type === 'array' && !jsonElement.enum)
    );
});
</script>

<template>
    <BFormGroup
        :label="hideLabel ? '' : props.label"
        :label-for="hideLabel ? '' : props.labelFor"
        :description="jsonElement.description"
    >
        <BInputGroup class="w-100">
            <b-input-group-prepend>
                <!--        Content is prepended to the input field-->
                <slot name="prepend"></slot>
            </b-input-group-prepend>
            <slot />
            <b-input-group-append>
                <!--        Content is appended to the input field-->
                <slot name="append" />
            </b-input-group-append>
        </BInputGroup>
    </BFormGroup>
</template>

<style scoped></style>
