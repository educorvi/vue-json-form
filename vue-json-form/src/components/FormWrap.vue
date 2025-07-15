<template>
    <show-on-wrapper :visible="show">
        <component
            :is="layoutComponent"
            :layoutElement="layoutElement"
            v-if="show"
        ></component>
    </show-on-wrapper>
</template>

<script setup lang="ts">
import type { LayoutElement } from '@educorvi/vue-json-form-schemas';
import { computed, shallowRef, markRaw, watch } from 'vue';
import LayoutElements from '@/components/LayoutElements';
import UnknownComponent from '@/components/UnknownComponent.vue';
import Buttons from '@/components/Buttons';
import { getComponent } from '@/stores/formStructure';
import { computedShowOnLogic } from '@/components/ShowOnLogic';
import { mergeDescendantControlOptionsOverrides } from '@/components/ProviderKeys';
import type { Control } from '@educorvi/vue-json-form-schemas';

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

let localLayoutElement: LayoutElement = props.layoutElement;

if (localLayoutElement.type === 'Control') {
    mergeDescendantControlOptionsOverrides(localLayoutElement);
}

const show = computedShowOnLogic(localLayoutElement);
</script>

<style scoped></style>
