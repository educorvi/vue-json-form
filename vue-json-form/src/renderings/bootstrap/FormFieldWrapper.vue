<script setup lang="ts">
import { BFormGroup, BInputGroup, BInputGroupText } from 'bootstrap-vue-next';
import { computed, useSlots } from 'vue';
import { injectJsonData } from '@/computedProperties/json';
import { hasItems, isTagsConfig } from '@/typings/typeValidators';

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
            !(hasItems(jsonElement) && jsonElement.items.enum) &&
            !jsonElement.enum &&
            !(
                isTagsConfig(layoutElement.options) &&
                layoutElement.options.tags?.enabled
            ))
    );
});

const slots = useSlots();

const hasPrependOrAppend = computed(() => {
    return (
        slots.prepend ||
        slots.append ||
        layoutElement.options?.prepend ||
        layoutElement.options?.append
    );
});
</script>

<template>
    <BFormGroup
        :label="hideLabel ? '' : props.label"
        :label-for="props.labelFor"
        :description="jsonElement.description"
    >
        <BInputGroup v-if="hasPrependOrAppend">
            <!--        Content is prepended to the input field-->
            <slot name="prepend">
                <BInputGroupText v-if="layoutElement.options?.prepend">
                    {{ layoutElement.options.prepend }}
                </BInputGroupText>
            </slot>

            <slot />
            <!--        Content is appended to the input field-->
            <slot name="append">
                <BInputGroupText v-if="layoutElement.options?.append">
                    {{ layoutElement.options.append }}
                </BInputGroupText>
            </slot>
        </BInputGroup>
        <div v-else>
            <slot />
        </div>
    </BFormGroup>
</template>

<style lang="scss"></style>
