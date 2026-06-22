<script setup lang="ts">
import { computed, provide } from 'vue';
import { savePathOverrideProviderKey } from '@/components/ProviderKeys.ts';
import type { LayoutElement } from '@educorvi/vue-json-form-schemas';
import XIcon from '@/assets/icons/XIcon.vue';
import GripVerticalIcon from '@/assets/icons/GripVerticalIcon.vue';
import { getArrayItemSavePath } from '@/Commons.ts';
import { getStores } from '@/computedProperties/json.ts';
import { isControl, isLayoutWithChildren } from '@/typings/typeValidators.ts';
import FormWrap from '@/components/FormWrap.vue';
import { getOption } from '@/renderings/renderHelpers';

const props = defineProps<{
    scope: string;
    index: number;
    itemID: string;
    baseSavePath: string;
    allowRemove: boolean;
    uiSchema?: LayoutElement;
}>();
const savePath = getArrayItemSavePath(props.baseSavePath, props.itemID);
// provide(savePathOverrideProviderKey, savePath);
const layoutElement = computed(() => {
    let uiSchema: LayoutElement;
    if (props.uiSchema) {
        uiSchema = JSON.parse(JSON.stringify(props.uiSchema));
    } else {
        uiSchema = {
            type: 'Control',
            scope: props.scope + '/items',
            options: {
                label: false,
            },
        };
    }
    replaceScopes(uiSchema);
    return uiSchema;
});
const emit = defineEmits<{
    (e: 'delete', id: string, savePath: string): void;
}>();
const ArrayButton = getStores().formStructureStore.getComponent('ArrayButton');

function replaceScopes(layoutElement: LayoutElement | undefined) {
    if (!layoutElement) {
        return;
    }
    if (isControl(layoutElement)) {
        layoutElement.scope = layoutElement.scope.replace(
            props.scope + '/items',
            getArrayItemSavePath(props.scope, props.itemID)
        );
        replaceScopes(getOption(layoutElement, 'uiSchema'));
    } else if (isLayoutWithChildren(layoutElement)) {
        layoutElement.elements.forEach(replaceScopes);
    }
}
</script>

<template>
    <div :id="itemID" class="vjf_arrayItem">
        <FormWrap :layout-element="layoutElement" in-array-item>
            <template #prepend>
                <div class="handle">
                    <GripVerticalIcon />
                </div>
            </template>
            <template #append>
                <ArrayButton
                    variant="outline-danger"
                    :disabled="!allowRemove"
                    aria-label="Delete Item"
                    @click="emit('delete', itemID, savePath)"
                >
                    <XIcon />
                </ArrayButton>
            </template>
        </FormWrap>
    </div>
</template>

<style scoped>
.handle {
    border: var(--bs-border-width) solid var(--bs-border-color);
    cursor: move;

    border-top-left-radius: var(--bs-border-radius);
    border-bottom-left-radius: var(--bs-border-radius);

    display: flex;
    justify-content: center;
    width: 40px;
}

.vjf_arrayItem > * {
    background: var(--bs-body-bg);
}

.vjf_arrayItem {
    margin-bottom: 0.75rem;
}
</style>
