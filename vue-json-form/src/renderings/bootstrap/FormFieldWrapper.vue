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

const additionalMainClasses = computed(() => {
    const classes = ['vjf_input-group-main-div'];

    if (slots.prepend) {
        classes.push('vjf_input-group-main-div-prepend');
    }
    if (slots.append) {
        classes.push('vjf_input-group-main-div-append');
    }

    return classes.join(' ');
});
</script>

<template>
    <BFormGroup
        :label="hideLabel ? '' : props.label"
        :label-for="props.labelFor"
        :description="jsonElement.description"
    >
        <BInputGroup
            class="w-100"
            :prepend="layoutElement.options?.prepend"
            :append="layoutElement.options?.append"
        >
            <!--        Content is prepended to the input field-->
            <slot name="prepend"></slot>

            <div :class="additionalMainClasses">
                <slot />
            </div>
            <!--        Content is appended to the input field-->
            <slot name="append" />
        </BInputGroup>
    </BFormGroup>
</template>

<style lang="scss">
.vjf_input-group-main-div {
    flex: 1;
    margin: 0;
    width: 100%;
}

.vjf_input-group-main-div > * {
    //border-radius: inherit;
    height: 100%;
}

.vjf_input-group-main-div > * > fieldset {
    margin-bottom: 0;

    padding-top: 5px;
    //padding-bottom: 5px;

    & > legend {
        margin-top: 0 !important;
    }
}

.vjf_input-group-main-div > .vjf_object {
    padding-left: 6px;
    padding-right: 6px;
}

.vjf_input-group-main-div-prepend > * {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;

    border-top: var(--bs-border-width) solid var(--bs-border-color);
    border-bottom: var(--bs-border-width) solid var(--bs-border-color);

    & > fieldset > .vjf_verticalLayout {
        border-left: none !important;
        padding-left: 0 !important;
        margin-left: 0 !important;
    }
}

.vjf_input-group-main-div-append > * {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}
</style>
