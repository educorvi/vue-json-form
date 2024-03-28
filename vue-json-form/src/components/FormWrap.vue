<template>
    <show-on-wrapper :visible="show">
        <component :is="layoutComponent" :layoutElement="layoutElement"></component>
    </show-on-wrapper>
</template>

<script setup lang="ts">
import type { LayoutElement, ShowOnFunctionType } from '@/typings/ui-schema';
import { computed, shallowRef, markRaw, watch, Ref } from 'vue';
import LayoutElements from '@/components/LayoutElements';
import UnknownComponent from '@/components/UnknownComponent.vue';
import Buttons from '@/components/Buttons';
import { getComponent } from '@/stores/formStructure';
import { isDependentElement, isLegacyShowOn } from '@/typings/typeValidators';
import { computedShowOnLogic, getComparisonFunction } from '@/components/ShowOnLogic';
import { computedAsync } from '@vueuse/core';
import { Parser } from '@educorvi/rita';
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';

const showOnWrapper = getComponent('showOnWrapper');

const { formData } = storeToRefs(useFormDataStore());

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: LayoutElement;
}>();

function getControlComponent(name: string | undefined) {
    switch (name) {
        case 'Control':
            return LayoutElements.Control;
        case 'VerticalLayout':
            return LayoutElements.VerticalLayout;
        case 'HorizontalLayout':
            return LayoutElements.HorizontalLayout;
        case 'Group':
            return LayoutElements.Group;
        case 'HTML':
            return LayoutElements.htmlRenderer;
        case 'Divider':
            return LayoutElements.Divider;
        case 'Button':
            return Buttons.vjfButton;
        case 'Buttongroup':
            return Buttons.vjfButtonGroup;
        default:
            return UnknownComponent;
    }
}

const layoutComponent = markRaw(getControlComponent(props.layoutElement.type));

const layoutElement = props.layoutElement;

let show = computedShowOnLogic(props.layoutElement);
</script>

<style scoped></style>
