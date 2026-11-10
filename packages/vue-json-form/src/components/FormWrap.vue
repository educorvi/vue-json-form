<template>
    <show-on-wrapper :visible="show">
        <template
            v-if="
                layoutElement.type === 'Control' &&
                ($slots.prepend || $slots.append)
            "
        >
            <component
                :is="layoutComponent"
                v-if="show"
                :layout-element="layoutElement"
            >
                <template v-if="$slots.prepend" #prepend>
                    <slot name="prepend" />
                </template>
                <template v-if="$slots.append" #append>
                    <slot name="append" />
                </template>
            </component>
        </template>
        <div v-else class="vjf-formwrap-with-slots">
            <div v-if="$slots.prepend" class="vjf-formwrap-with-slots-prepend">
                <slot name="prepend" />
            </div>
            <component
                :is="layoutComponent"
                v-if="show"
                :layout-element="layoutElement"
                class="vjf-formwrap-with-slots-main"
            >
            </component>
            <div v-if="$slots.append" class="vjf-formwrap-with-slots-append">
                <slot name="append" />
            </div>
        </div>
    </show-on-wrapper>
</template>

<script setup lang="ts">
import type {
    DescendantControlOverrides,
    LayoutElement,
} from '@educorvi/vue-json-form-schemas';
import { inject, markRaw, provide } from 'vue';
import LayoutElements from '@/components/LayoutElements';
import UnknownComponent from '@/components/UnknownComponent.vue';
import Buttons from '@/components/Buttons';
import { computedShowOnLogic } from '@/components/ShowOnLogic';
import {
    descendantControlOverridesProviderKey,
    formIdProviderKey,
    inArrayItemProviderKey,
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

    inArrayItem?: boolean;
}>();

provide(inArrayItemProviderKey, props.inArrayItem ?? false);

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

<style lang="scss" scoped>
.vjf-formwrap-with-slots {
    display: flex;
    flex-direction: row;

    & > *:nth-child(2).vjf-formwrap-with-slots-main {
        border-top: var(--bs-border-width) solid var(--bs-border-color);
        border-bottom: var(--bs-border-width) solid var(--bs-border-color);
        padding: 0.75rem;
    }

    & > .vjf-formwrap-with-slots-main {
        flex-grow: 1;
    }

    & > .vjf-formwrap-with-slots-prepend * {
        border-bottom-right-radius: 0;
        border-top-right-radius: 0;
        height: 100%;
    }

    & > .vjf-formwrap-with-slots-append * {
        border-bottom-left-radius: 0;
        border-top-left-radius: 0;
        height: 100%;
    }
}
</style>
