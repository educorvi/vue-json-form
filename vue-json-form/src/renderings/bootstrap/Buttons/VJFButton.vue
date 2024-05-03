<script setup lang="ts">
import type { Button } from '@/typings/ui-schema';
import { BButton } from 'bootstrap-vue-next';
import { computedCssClass } from '@/computedProperties/css';
import { computed } from 'vue';
import { hasOptions } from '@/typings/typeValidators';

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: Button;
}>();
const cssClass = computedCssClass(props.layoutElement);
const nativeSubmitSettings = computed(() => {
    if (hasOptions(props.layoutElement)) {
        return props.layoutElement.options.nativeSubmitOptions || {};
    }
    return {};
});
</script>

<template>
    <b-button
        :variant="layoutElement.options?.variant"
        :type="layoutElement.buttonType"
        :class="cssClass"
        :formaction="nativeSubmitSettings.formaction"
        :formmethod="nativeSubmitSettings.formmethod"
        :formtarget="nativeSubmitSettings.formtarget"
        :formenctype="nativeSubmitSettings.formenctype"
        >{{ layoutElement.text }}</b-button
    >
</template>

<style scoped></style>
