<script setup lang="ts">
import { BFormGroup } from 'bootstrap-vue-next';
import { computed } from 'vue';
import { injectJsonData } from '@/computedProperties/json';

const props = defineProps<{
    label: string;
    labelFor: string;
}>();

const { jsonElement } = injectJsonData();
const hideLabel = computed(() => {
    return jsonElement.type === 'boolean';
});
</script>

<template>
    <BFormGroup :label="hideLabel ? '' : props.label" :label-for="hideLabel ? '' : props.labelFor">
        <slot />
    </BFormGroup>
</template>

<style scoped></style>
