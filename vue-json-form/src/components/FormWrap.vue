<template>
    <show-on-wrapper :visible="show">
        <component :is="layoutComponent" :layoutElement="layoutElement"></component>
    </show-on-wrapper>
</template>

<script setup lang="ts">
import type { LayoutElement, ShowOnFunctionType } from '@/typings/ui-schema';
import { computed, shallowRef, markRaw } from 'vue';
import LayoutElements from '@/components/LayoutElements';
import UnknownComponent from '@/components/UnknownComponent.vue';
import Buttons from '@/components/Buttons';
import { isDependentElement } from '@/components/LayoutElements/LayoutCommons';
import { getComponent } from '@/stores/formStructure';

const showOnWrapper = getComponent('showOnWrapper');

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

function getComparisonFunction(functionName: ShowOnFunctionType) {
    switch (functionName) {
        case 'EQUALS':
            return (a: any, b: any) => {
                if (a === undefined) a = false;
                return a == b;
            };
        case 'NOT_EQUALS':
            return (a: any, b: any) => {
                if (a === undefined) a = false;
                return a != b;
            };
        case 'GREATER':
            return (a: any, b: any) => a > b;
        case 'GREATER_OR_EQUAL':
            return (a: any, b: any) => a >= b;
        case 'SMALLER':
            return (a: any, b: any) => a < b;
        case 'SMALLER_OR_EQUAL':
            return (a: any, b: any) => a < b;
        case 'LONGER':
            return (a: any, b: any) => (a || '').length > b;
    }
}

const show = computed(() => {
    if (!isDependentElement(props.layoutElement)) {
        return true;
    }
    return true;
});
</script>

<style scoped></style>
