<script setup lang="ts">
import { BFormGroup } from 'bootstrap-vue-next';
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
        <slot />
    </BFormGroup>
</template>

<style scoped></style>
