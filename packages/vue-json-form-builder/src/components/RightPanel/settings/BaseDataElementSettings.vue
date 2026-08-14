<script setup lang="ts">
import { computed, ref } from 'vue';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldText from '@/components/shared/fields/FieldText.vue';
import FieldTextarea from '@/components/shared/fields/FieldTextarea.vue';
import FieldCheck from '@/components/shared/fields/FieldCheck.vue';
import {
    BaseDataElement,
    ContainerElement,
    Form,
    type FormElement,
} from '@educorvi/vue-json-form-builder-schemas';
import { useElementSettings } from './useElementSettings';

const {
    builder,
    element,
    setField,
    stringField,
    optionalString,
    booleanField,
} = useElementSettings();

const title = stringField('title');
const description = optionalString('description');
const hidden = booleanField('hidden');
const tooltip = optionalString('tooltip');
const preHtml = optionalString('preHtml');
const postHtml = optionalString('postHtml');

// ── Name (path segment) — must be unique among siblings ─────────────────────

const nameError = ref('');

/** The element's `id` IS its path segment (JSON pointer / properties/<name>). */
const name = computed({
    get: () => {
        const el = element.value;
        return el instanceof BaseDataElement ? el.id : '';
    },
    set: (v: string) => {
        const el = element.value;
        if (!(el instanceof BaseDataElement)) return;
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

function isSiblingNameTaken(el: BaseDataElement, candidate: string): boolean {
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
    <!-- Basic: name (path segment) + title + description (inherited by every BaseDataElement) -->
    <SettingsSection title="Basic" icon="bi bi-sliders">
        <FieldText
            v-model="name"
            label="Name"
            placeholder="element-name"
            field-name="id"
        />
        <p v-if="nameError" class="small text-danger mb-0">
            {{ nameError }}
        </p>
        <FieldText
            v-model="title"
            label="Title"
            placeholder="Element title"
            field-name="title"
        />
        <FieldTextarea
            v-model="description"
            label="Description"
            placeholder="Optional description"
            field-name="description"
        />
    </SettingsSection>

    <!-- Options: inherited by every BaseDataElement -->
    <SettingsSection title="Options" icon="bi bi-gear" :collapsible="true">
        <FieldCheck v-model="hidden" label="Hidden" field-name="hidden" />
        <FieldText v-model="tooltip" label="Tooltip" field-name="tooltip" />
        <FieldTextarea
            v-model="preHtml"
            label="Pre HTML"
            field-name="preHtml"
        />
        <FieldTextarea
            v-model="postHtml"
            label="Post HTML"
            field-name="postHtml"
        />
    </SettingsSection>
</template>
