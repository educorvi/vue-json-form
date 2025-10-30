<script setup lang="ts">
import { BFormGroup, BInputGroup, BInputGroupText } from 'bootstrap-vue-next';
import { computed, type ComputedRef, useSlots } from 'vue';
import { injectJsonData } from '@/computedProperties/json';
import HelpPopover from '@/renderings/bootstrap/HelpPopover.vue';
import { getIsObjectOrArrayViewComputed } from '@/renderings/bootstrap/common.ts';

const props = defineProps<{
    label: string;
    labelFor: string;
}>();

const { jsonElement, layoutElement } = injectJsonData();
const isObjectOrArrayView = getIsObjectOrArrayViewComputed(
    jsonElement,
    layoutElement
);
const hideLabel = computed(() => {
    return (
        jsonElement.type === 'boolean' ||
        layoutElement.options?.label === false ||
        isObjectOrArrayView.value
    );
});

const slots = useSlots();

const hasPrependOrAppend: ComputedRef<boolean> = computed(() => {
    return !!(
        slots.prepend ||
        slots.append ||
        layoutElement.options?.prepend ||
        layoutElement.options?.append
    );
});
</script>

<template>
    <BFormGroup
        :label-for="props.labelFor"
        :description="
            !isObjectOrArrayView ? jsonElement.description : undefined
        "
    >
        <template #label>
            <span v-show="!hideLabel">
                {{ props.label }}
                <HelpPopover />
            </span>
        </template>
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
