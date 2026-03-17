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
import type {
    DescendantControlOverrides,
    LayoutElement,
} from '@educorvi/vue-json-form-schemas';
import { inject, markRaw } from 'vue';
import LayoutElements from '@/components/LayoutElements';
import UnknownComponent from '@/components/UnknownComponent.vue';
import Buttons from '@/components/Buttons';
import { computedShowOnLogic } from '@/components/ShowOnLogic';
import {
    descendantControlOverridesProviderKey,
    formIdProviderKey,
    mergeDescendantControlOptionsOverrides,
} from '@/components/ProviderKeys';
import { getStores } from '@/computedProperties/json.ts';

const { formStructureStore } = getStores();

const showOnWrapper = formStructureStore.getComponent('showOnWrapper');

const formId = inject(formIdProviderKey);
if (!formId) throw new Error('`formIdProviderKey` is not provided.');

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
        case 'Modal':
            return formStructureStore.getComponent('Modal');
        default:
            return UnknownComponent;
    }
}

const layoutComponent = markRaw(getControlComponent(props.layoutElement.type));

let localLayoutElement: LayoutElement = props.layoutElement;

const overridesMap: DescendantControlOverrides | undefined = inject(
    descendantControlOverridesProviderKey
);

if (localLayoutElement.type === 'Control') {
    mergeDescendantControlOptionsOverrides(localLayoutElement, overridesMap);
}

const show = computedShowOnLogic(localLayoutElement, overridesMap, formId);
</script>

<style scoped></style>
