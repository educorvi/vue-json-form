<script setup lang="ts">
import { computed, ref } from 'vue';
import FieldText from '@/components/shared/fields/FieldText.vue';
import {
    ContainerElement,
    Form,
    type FormElement,
} from '@educorvi/vue-json-forms-builder-schemas';
import { useElementSettings } from './useElementSettings';

/**
 * Editable element name — the `id` of an element IS its path segment in the
 * generated JSON Schema (`properties/<name>`) and part of the scope in the
 * UI Schema (`#/properties/<name>`). Works for every element type (Entity.id
 * is required), must be unique among siblings.
 */
const { builder, element, setField } = useElementSettings();

const nameError = ref('');

const name = computed({
    get: () => element.value?.id ?? '',
    set: (v: string) => {
        const el = element.value;
        if (!el) return;
        const newName = v.trim();
        if (!newName) {
            nameError.value = 'The name must not be empty.';
            return;
        }
        if (newName === el.id) {
            nameError.value = '';
            return;
        }
        if (isSiblingNameTaken(el, newName)) {
            nameError.value = `"${newName}" is already used by a sibling element.`;
            return;
        }
        nameError.value = '';
        setField('id', newName);
    },
});

function isContainer(
    parent: Form | FormElement
): parent is Form | ContainerElement {
    return parent instanceof ContainerElement || parent instanceof Form;
}

function isSiblingNameTaken(el: FormElement | Form, candidate: string): boolean {
    const fd = builder.formDefinition.value;
    if (!fd) return false;
    const parentId = fd.getParentId(el.uid);
    if (parentId === undefined) return false; // root has no siblings
    const parent =
        parentId === fd.root.uid ? fd.root : fd.getElementById(parentId);
    if (!parent || !isContainer(parent)) return false;
    for (const childUid of parent.children) {
        if (childUid === el.uid) continue;
        const sibling = fd.getElementById(childUid);
        if (sibling && sibling.id === candidate) return true;
    }
    return false;
}
</script>

<template>
    <div>
        <FieldText
            v-model="name"
            label="Name"
            placeholder="element-name"
            field-name="id"
        />
        <p v-if="nameError" class="small text-danger mb-0">
            {{ nameError }}
        </p>
    </div>
</template>
