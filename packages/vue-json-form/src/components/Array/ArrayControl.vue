<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useFormDataStore } from '@/stores/formData.ts';
import {
    arrayContainsValue,
    computedLabel,
    getComputedRequired,
    injectJsonData,
} from '@/computedProperties/json.ts';
import { controlID } from '@/computedProperties/misc.ts';
import {
    generateUUID,
    getArrayItemSavePath,
    isArrayItemKey,
    VJF_ARRAY_ITEM_PREFIX,
} from '@/Commons.ts';
import { getComponent, useFormStructureStore } from '@/stores/formStructure.ts';
import draggable from 'vuedraggable/src/vuedraggable';
import {
    ref,
    nextTick,
    computed,
    onBeforeMount,
    watch,
    useTemplateRef,
    inject,
} from 'vue';
import ArrayItem from '@/components/Array/ArrayItem.vue';
import PlusIcon from '@/assets/icons/PlusIcon.vue';
import { getOption } from '@/utilities.ts';
import {
    languageProviderKey,
    setDescendantControlOverride,
} from '@/components/ProviderKeys.ts';
import { isDefined } from '@/typings/typeValidators.ts';
import { type ComponentExposed } from 'vue-component-type-helpers';

const ErrorViewer = getComponent('ErrorViewer');
const HelpPopover = getComponent('HelpPopover');
const ArrayButton = getComponent('ArrayButton');
const ConfirmationModal = getComponent('ConfirmationModal');

const deleteItemsModal = useTemplateRef<
    ComponentExposed<typeof ConfirmationModal>
>('delete-remaining-items-modal');

const { formData, arrays } = storeToRefs(useFormDataStore());
const { jsonSchema } = storeToRefs(useFormStructureStore());

const { jsonElement, layoutElement, savePath } = injectJsonData();
const languageProvider = inject(languageProviderKey);
const id = controlID(savePath);
const required = getComputedRequired(layoutElement);

function addField(skipFocus = false, value?: any) {
    const genId = VJF_ARRAY_ITEM_PREFIX + generateUUID();
    if (!jsonSchema.value) {
        throw new Error('jsonSchema is unexpectedly undefined');
    }
    if (!isDefined(savePath)) {
        throw new Error('savePath must be provided');
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
            const lastInput: HTMLInputElement | null | undefined =
                children[children.length - 1]?.querySelector('input');
            lastInput?.focus();
        });
    }
}

/**
 * Ensures that the form data contains a minimum number of fields by adding
 * the minimal number of fields if necessary.
 *
 * @param {number} diff - An optional value to raise or lower the minimum number of fields. Defaults to 0.
 * @return {void} This method does not return a value.
 */
function ensureMinNumberOfFields(diff: number = 0): void {
    const num = (jsonElement.value.minItems || 0) + diff;
    for (let i = formData.value[savePath].length; i < num; i++) {
        addField(true);
    }
}

function onAddFieldButton() {
    ensureMinNumberOfFields(-1);
    addField();
}

const label = computedLabel(layoutElement);

const drag = ref(false);
const dragOptions = ref({
    animation: 200,
    group: `array-${label.value}`,
    disabled: false,
    ghostClass: 'ghost',
});

function deleteAllItems() {
    for (const value of formData.value[savePath]) {
        const itemSavePath = getArrayItemSavePath(savePath, value);
        const descendents = Object.keys(formData.value).filter((key) =>
            key.startsWith(itemSavePath)
        );
        for (const descendent of descendents) {
            delete formData.value[descendent];
        }
    }
    formData.value[savePath] = [];
}

function deleteItemWithID(id: string, itemSavePath: string) {
    if (
        formData.value[savePath].length <= (jsonElement.value.minItems || 0) &&
        formData.value[savePath].length > 1
    ) {
        if (required.value) {
            return;
        } else {
            deleteItemsModal.value?.show();
            return;
        }
    }
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

function setGlobalArrayRegister() {
    arrays.value[savePath] = {
        key: savePath,
        jsonSchema: jsonElement.value,
        required: required.value,
    };
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
    setGlobalArrayRegister();
    if (required.value) {
        ensureMinNumberOfFields();
    }

    if (layoutElement.value.options?.maxFileSize) {
        setDescendantControlOverride(layoutElement.value.scope + '/items', {
            options: {
                maxFileSize: layoutElement.value.options.maxFileSize,
            },
        });
    }
}

watch(
    () => formData.value[savePath],
    () => {
        if (!formData.value[savePath]) {
            initArray();
        }
    }
);
watch([() => required.value, () => jsonElement.value.minItems], () => {
    if (required.value) {
        ensureMinNumberOfFields();
    }
});

watch([() => required.value, () => jsonElement.value], setGlobalArrayRegister);

const allowAddField = computed(() => {
    return (
        formData.value[savePath].length <
        (jsonElement.value.maxItems || Number.MAX_VALUE)
    );
});

const allowRemoveField = computed(() => {
    return (
        !required.value ||
        formData.value[savePath].length > (jsonElement.value.minItems || 0)
    );
});

const isArrayItem = computed(() => {
    return isArrayItemKey(layoutElement.value.scope.split('.').pop() || '');
});

onBeforeMount(initArray);
</script>

<template>
    <div>
        <div class="vjf_label_wrapper">
            <label
                :for="id"
                v-if="!isArrayItem"
                v-show="getOption(layoutElement, 'label', true)"
            >
                <span class="large-label">{{ label }}</span>
            </label>
            <div class="vjf_array-help-icon-wrapper">
                <HelpPopover />
            </div>
        </div>
        <p v-if="jsonElement.description">
            {{ jsonElement.description }}
        </p>
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

            <array-button
                variant="outline-primary"
                class="w-100"
                @click="onAddFieldButton"
                :disabled="!allowAddField"
                aria-label="Add Item"
            >
                <span v-if="getOption(layoutElement, 'addButtonText')">
                    {{ getOption(layoutElement, 'addButtonText') }}
                </span>
                <PlusIcon v-else />
            </array-button>
        </div>
        <error-viewer v-else header="Error" :id="id">
            The type of the array's items is missing in the schema
        </error-viewer>

        <confirmation-modal
            ref="delete-remaining-items-modal"
            :title="
                languageProvider?.getString(
                    'modals.delete-remaining-items.title'
                ) || ''
            "
            :confirmButtonText="
                languageProvider?.getString(
                    'modals.delete-remaining-items.confirm'
                )
            "
            confirmButtonVariant="danger"
            @confirm="deleteAllItems"
            :cancelButtonText="
                languageProvider?.getString(
                    'modals.delete-remaining-items.cancel'
                )
            "
        >
            {{
                languageProvider?.getStringTemplate(
                    'modals.delete-remaining-items.text',
                    jsonElement.minItems
                )
            }}
        </confirmation-modal>
    </div>
</template>

<style lang="scss">
.large-label {
    font-size: calc(1.275rem + 0.3vw);
}

.vjf_array-help-icon-wrapper {
    padding-left: 1rem * 0.25;
}

.vjf_label_wrapper {
    display: flex;
    align-items: center;
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
