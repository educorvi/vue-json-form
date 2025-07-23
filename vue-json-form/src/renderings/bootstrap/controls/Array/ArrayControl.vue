<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData';
import {
    arrayContainsValue,
    cleanScope,
    computedLabel,
    getComputedJsonElement,
    getComputedParentJsonPath,
    injectJsonData,
} from '@/computedProperties/json';
import { controlID } from '@/computedProperties/misc';
import { generateUUID, isArrayItemKey, VJF_ARRAY_ITEM_PREFIX } from '@/Commons';
import { BButton } from 'bootstrap-vue-next';
import { getComponent, useFormStructureStore } from '@/stores/formStructure';
import draggable from 'vuedraggable/src/vuedraggable';
import { ref, nextTick, onMounted, computed, onBeforeMount } from 'vue';
import ArrayItem from '@/renderings/bootstrap/controls/Array/ArrayItem.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import type { CoreSchemaMetaSchema } from '@educorvi/vue-json-form-schemas';

const ErrorViewer = getComponent('ErrorViewer');

const { formData } = storeToRefs(useFormDataStore());
const { jsonSchema, arrays } = storeToRefs(useFormStructureStore());

const { savePath } = injectJsonData();
const id = controlID(savePath);

function addField(skipFocus = false, value?: any) {
    const genId = VJF_ARRAY_ITEM_PREFIX + generateUUID();
    if (!jsonSchema.value) {
        throw new Error('jsonSchema is unexpectedly undefined');
    }
    formData.value[savePath].push(genId);
    // Define an empty string for the new item so that the uuid will not be visible in `cleanedData`
    formData.value[`${savePath}.${genId}`] = value ?? '';
    if (!skipFocus) {
        nextTick().then(() => {
            const children = document
                .getElementById(id.value)
                ?.querySelectorAll('.list-group > *');
            if (!children) {
                return;
            }
            const lastInput: HTMLInputElement | null =
                children[children.length - 1].querySelector('input');
            lastInput?.focus();
        });
    }
}

const { layoutElement, jsonElement } = injectJsonData();

const label = computedLabel(layoutElement);

const drag = ref(false);
const dragOptions = ref({
    animation: 200,
    group: `array-${label.value}`,
    disabled: false,
    ghostClass: 'ghost',
});

function deleteItemWithID(id: string, itemSavePath: string) {
    const index = formData.value[savePath].indexOf(id);
    if (index > -1) {
        formData.value[savePath].splice(index, 1);
    } else {
        console.warn(
            'Could not find item with id',
            id,
            'in',
            formData.value[savePath]
        );
    }
    delete formData.value[itemSavePath];
}

function initArray() {
    if (!formData.value[savePath]) {
        formData.value[savePath] = [];
    } else if (arrayContainsValue(formData.value[savePath])) {
        const values = formData.value[savePath];
        formData.value[savePath] = [];
        for (const value of values) {
            addField(true, value);
        }
    }
    arrays.value.push(savePath);
    for (
        let i = formData.value[savePath].length;
        i < (jsonElement.minItems || 0);
        i++
    ) {
        addField(true);
    }
}

const allowAddField = computed(() => {
    if (!formData.value[savePath]) {
        initArray();
    }
    return (
        formData.value[savePath].length <
        (jsonElement.maxItems || Number.MAX_VALUE)
    );
});

const allowRemoveField = computed(() => {
    if (!formData.value[savePath]) {
        initArray();
    }
    return formData.value[savePath].length > (jsonElement.minItems || 0);
});

const isArrayItem = computed(() => {
    return isArrayItemKey(layoutElement.scope.split('.').pop() || '');
});

onBeforeMount(initArray);
</script>

<template>
    <div>
        <label :for="id" class="large-label" v-if="!isArrayItem">{{
            label
        }}</label>
        <div
            class="vjf_array"
            v-if="
                typeof jsonElement.items === 'object' &&
                'type' in jsonElement.items
            "
            :id="id"
        >
            <draggable
                class="list-group"
                v-model="formData[savePath]"
                handle=".handle"
                :itemKey="(elemId: string) => elemId"
                key="draggable"
                @start="drag = true"
                @end="drag = false"
                v-bind="dragOptions"
                :componentData="{
                    tag: 'div',
                    type: 'transition-group',
                    name: !drag ? 'flip-list' : null,
                }"
            >
                <template #item="{ element, index }">
                    <div :key="element">
                        <ArrayItem
                            :scope="layoutElement.scope"
                            :baseSavePath="savePath"
                            :index="index"
                            :itemID="element"
                            @delete="deleteItemWithID"
                            :allowRemove="allowRemoveField"
                        />
                    </div>
                </template>
            </draggable>

            <b-button
                variant="outline-primary"
                class="w-100"
                @click="() => addField()"
                :disabled="!allowAddField"
                aria-label="Add Item"
            >
                <PlusIcon />
            </b-button>
        </div>
        <error-viewer v-else header="Error" :id="id">
            The type of the array's items is missing in the schema
        </error-viewer>
    </div>
</template>

<style>
.large-label {
    font-size: 1.4rem;
}

.flip-list-move {
    transition: transform 0.5s;
}

.no-move {
    transition: transform 0s;
}

.ghost {
    opacity: 0.9;
}

.list-group .input-group {
    border-radius: var(--bs-border-radius);
}

.ghost > * > * > * > * > .input-group {
    box-shadow: 5px 5px 5px #1e2024;
    transform: scale(1.005);
    transition: all 0.1s ease-in-out;
}
</style>
