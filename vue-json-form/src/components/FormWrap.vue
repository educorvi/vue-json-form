<template>
    <show-on-wrapper :visible="show">
        <component :is="layoutComponent" :layoutElement="layoutElement"></component>
    </show-on-wrapper>
</template>

<script setup lang="ts">
import type { LayoutElement, ShowOnFunctionType } from '@/typings/ui-schema';
import { computed } from 'vue';
import type { Component } from 'vue';
import LayoutElements from '@/components/LayoutElements';
import UnknownComponent from '@/components/UnknownComponent.vue';
import Buttons from '@/components/Buttons';
import { isDependentElement } from '@/components/LayoutElements/LayoutCommons';
import { getComponent } from '@/defaultRendering/DefaultComponents';

const showOnWrapper = getComponent('showOnWrapper');

const props = defineProps<{
    /**
     * The UI Schema of this Element
     */
    layoutElement: LayoutElement;
}>();

const layoutComponent = computed<Component | undefined>(() => {
    if (!props.layoutElement) return undefined;
    switch (props.layoutElement.type) {
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
    }

    return UnknownComponent;
});

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
    return false;
});
</script>

<style scoped></style>
