<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '@/stores/formStore';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldGroup from '@/components/shared/FieldGroup.vue';
import OptionsRenderer from '@/components/shared/OptionsRenderer.vue';
import ShowOnEditor from '../ShowOnEditor.vue';
import type { ControlElement, JSONSchema } from '@/types/formTypes';

const props = defineProps<{
    element: ControlElement;
}>();

const store = useFormStore();

const key = computed(() => props.element.scope.split('/').pop() ?? '');
const schemaProp = computed<JSONSchema>(() =>
    store.getControlSchemaProperty(props.element._id)
);

function updateSchema(updates: Partial<JSONSchema>) {
    store.updateControlSchemaProperty(props.element._id, updates);
}

function updateOptions(updates: Partial<ControlElement['options']>) {
    store.updateElement(props.element._id, {
        options: { ...props.element.options, ...updates },
    } as Partial<ControlElement>);
}

function updateScope(newKey: string) {
    if (newKey && newKey !== key.value) {
        store.renameControlKey(props.element._id, key.value, newKey);
    }
}

const isRequired = computed(() => store.isControlRequired(props.element._id));
const hasEnum = computed(() => (schemaProp.value.enum?.length ?? 0) > 0);

const typeOptions = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Integer', value: 'integer' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Array', value: 'array' },
    { label: 'Object', value: 'object' },
];

const enumValues = computed({
    get: () => (schemaProp.value.enum ?? []).join('\n'),
    set: (v: string) => {
        const values = v
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);
        updateSchema({ enum: values.length > 0 ? values : undefined });
    },
});

const formattingSchema = {
    label: { type: 'boolean', title: 'Show Label', default: true },
    placeholder: { type: 'string', title: 'Placeholder' },
    cssClass: { type: 'string', title: 'CSS Class' },
    hidden: { type: 'boolean', title: 'Hidden', default: false },
    disabled: { type: 'boolean', title: 'Disabled', default: false },
    append: { type: 'string', title: 'Append Text' },
    prepend: { type: 'string', title: 'Prepend Text' },
    forceRequired: { type: 'boolean', title: 'Force Required', default: false },
};

const inputSchema = {
    format: {
        type: 'string',
        title: 'Format',
        enum: [
            // Text inputs
            'text', 'password', 'search', 'url', 'tel', 'email', 'color', 'hidden',
            // Date/time inputs
            'time', 'date', 'datetime-local',
        ],
        default: 'text',
    },
    multi: { type: 'boolean', title: 'Textarea (multi-line)', default: false },
    textAlign: {
        type: 'string',
        title: 'Text Align',
        enum: ['left', 'right', 'center', 'start', 'end'],
    },
};

const numberSchema = {
    range: { type: 'boolean', title: 'Range Slider', default: false },
};

const enumDisplaySchema = {
    displayAs: {
        type: 'string',
        title: 'Display As',
        enum: ['select', 'radiobuttons', 'switches', 'buttons'],
        default: 'select',
    },
    stacked: { type: 'boolean', title: 'Stacked Layout', default: false },
};

const fileSchema = {
    acceptedFileType: {
        type: 'string',
        title: 'Accepted File Types',
        description: 'e.g. image/*,.pdf',
    },
    maxFileSize: { type: 'integer', title: 'Max File Size (bytes)' },
    displayAsSingleUploadField: {
        type: 'boolean',
        title: 'Single Upload Field',
        default: false,
    },
};

const optionsValues = computed(() => props.element.options ?? {});

function onFormattingUpdate(key: string, value: any) {
    updateOptions({ [key]: value });
}
</script>

<template>
    <div class="vstack gap-1">
        <!-- Field Identity -->
        <SettingsSection title="Field Identity" icon="bi bi-key">
            <FieldGroup label="Field Key" hint="JSON Schema property name">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="key"
                    placeholder="fieldName"
                    @change="updateScope(($event.target as HTMLInputElement).value)"
                />
            </FieldGroup>

            <FieldGroup label="Display Title">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="schemaProp.title"
                    placeholder="Field Label"
                    @input="updateSchema({ title: ($event.target as HTMLInputElement).value })"
                />
            </FieldGroup>

            <FieldGroup label="Description">
                <textarea
                    class="form-control form-control-sm"
                    :value="schemaProp.description"
                    rows="2"
                    placeholder="Describe this field..."
                    @input="updateSchema({ description: ($event.target as HTMLTextAreaElement).value })"
                />
            </FieldGroup>

            <div class="d-flex align-items-center justify-content-between py-1">
                <label class="text-xs fw-medium text-body">Required</label>
                <div class="form-check form-switch mb-0">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        :checked="isRequired"
                        @change="store.setControlRequired(element._id, ($event.target as HTMLInputElement).checked)"
                    />
                </div>
            </div>
        </SettingsSection>

        <!-- Data Type -->
        <SettingsSection title="Data Type" icon="bi bi-tag" collapsible>
            <FieldGroup label="Type">
                <select
                    class="form-select form-select-sm"
                    :value="schemaProp.type"
                    @change="updateSchema({ type: ($event.target as HTMLSelectElement).value as any })"
                >
                    <option value="">— select —</option>
                    <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
            </FieldGroup>

            <!-- String-specific -->
            <template v-if="schemaProp.type === 'string' || !schemaProp.type">
                <FieldGroup label="Min Length">
                    <input type="number" class="form-control form-control-sm" :value="schemaProp.minLength ?? ''" min="0"
                        @input="updateSchema({ minLength: ($event.target as HTMLInputElement).value !== '' ? Number(($event.target as HTMLInputElement).value) : undefined })" />
                </FieldGroup>
                <FieldGroup label="Max Length">
                    <input type="number" class="form-control form-control-sm" :value="schemaProp.maxLength ?? ''" min="0"
                        @input="updateSchema({ maxLength: ($event.target as HTMLInputElement).value !== '' ? Number(($event.target as HTMLInputElement).value) : undefined })" />
                </FieldGroup>
                <FieldGroup label="Pattern (regex)">
                    <input type="text" class="form-control form-control-sm" :value="schemaProp.pattern ?? ''" placeholder="^[A-Za-z]+$"
                        @input="updateSchema({ pattern: ($event.target as HTMLInputElement).value || undefined })" />
                </FieldGroup>
            </template>

            <!-- Number-specific -->
            <template v-if="schemaProp.type === 'number' || schemaProp.type === 'integer'">
                <FieldGroup label="Minimum">
                    <input type="number" class="form-control form-control-sm" :value="schemaProp.minimum ?? ''"
                        @input="updateSchema({ minimum: ($event.target as HTMLInputElement).value !== '' ? Number(($event.target as HTMLInputElement).value) : undefined })" />
                </FieldGroup>
                <FieldGroup label="Maximum">
                    <input type="number" class="form-control form-control-sm" :value="schemaProp.maximum ?? ''"
                        @input="updateSchema({ maximum: ($event.target as HTMLInputElement).value !== '' ? Number(($event.target as HTMLInputElement).value) : undefined })" />
                </FieldGroup>
            </template>

            <!-- Array-specific -->
            <template v-if="schemaProp.type === 'array'">
                <FieldGroup label="Min Items">
                    <input type="number" class="form-control form-control-sm" :value="schemaProp.minItems ?? ''" min="0"
                        @input="updateSchema({ minItems: ($event.target as HTMLInputElement).value !== '' ? Number(($event.target as HTMLInputElement).value) : undefined })" />
                </FieldGroup>
                <FieldGroup label="Max Items">
                    <input type="number" class="form-control form-control-sm" :value="schemaProp.maxItems ?? ''" min="0"
                        @input="updateSchema({ maxItems: ($event.target as HTMLInputElement).value !== '' ? Number(($event.target as HTMLInputElement).value) : undefined })" />
                </FieldGroup>
            </template>

            <FieldGroup label="Default Value">
                <input type="text" class="form-control form-control-sm"
                    :value="schemaProp.default !== undefined ? String(schemaProp.default) : ''"
                    placeholder="Default value"
                    @input="updateSchema({ default: ($event.target as HTMLInputElement).value || undefined })" />
            </FieldGroup>
        </SettingsSection>

        <!-- Enum Options -->
        <SettingsSection title="Enum Options" icon="bi bi-list-ul" collapsible>
            <FieldGroup label="Values (one per line)" hint="Leave empty to disable enum">
                <textarea
                    v-model="enumValues"
                    class="form-control form-control-sm font-mono"
                    rows="4"
                    placeholder="option1&#10;option2&#10;option3"
                />
            </FieldGroup>
            <OptionsRenderer
                v-if="hasEnum"
                :schema="enumDisplaySchema"
                :values="optionsValues"
                @update="onFormattingUpdate"
            />
        </SettingsSection>

        <!-- Display Options -->
        <SettingsSection title="Display Options" icon="bi bi-eye" collapsible>
            <OptionsRenderer
                :schema="formattingSchema"
                :values="optionsValues"
                @update="onFormattingUpdate"
            />

            <template v-if="schemaProp.type === 'string' || !schemaProp.type">
                <hr class="my-2" />
                <OptionsRenderer
                    :schema="inputSchema"
                    :values="optionsValues"
                    @update="onFormattingUpdate"
                />
            </template>

            <template v-if="schemaProp.type === 'number' || schemaProp.type === 'integer'">
                <hr class="my-2" />
                <OptionsRenderer
                    :schema="numberSchema"
                    :values="optionsValues"
                    @update="onFormattingUpdate"
                />
            </template>

            <template v-if="schemaProp.format === 'uri'">
                <hr class="my-2" />
                <OptionsRenderer
                    :schema="fileSchema"
                    :values="optionsValues"
                    @update="onFormattingUpdate"
                />
            </template>

            <hr class="my-2" />
            <FieldGroup label="Help Text">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="element.options?.help?.text ?? ''"
                    placeholder="Helper text for users..."
                    @input="updateOptions({ help: ($event.target as HTMLInputElement).value ? { text: ($event.target as HTMLInputElement).value } : undefined })"
                />
            </FieldGroup>
        </SettingsSection>

        <!-- Visibility -->
        <SettingsSection title="Visibility Rule (ShowOn)" icon="bi bi-eye-slash" collapsible>
            <ShowOnEditor :element-id="element._id" :show-on="element.showOn" />
        </SettingsSection>
    </div>
</template>
