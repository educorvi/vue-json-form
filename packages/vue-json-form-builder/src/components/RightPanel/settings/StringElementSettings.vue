<script setup lang="ts">
import { computed } from 'vue';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldText from '@/components/shared/fields/FieldText.vue';
import FieldNumber from '@/components/shared/fields/FieldNumber.vue';
import FieldSelect from '@/components/shared/fields/FieldSelect.vue';
import FieldCheck from '@/components/shared/fields/FieldCheck.vue';
import { StringFormat } from '@educorvi/vue-json-form-builder-schemas';
import { useElementSettings } from './useElementSettings';
import SimpleElementSettings from './SimpleElementSettings.vue';

const { element, setField, enumField, optionalString, optionalNumber } =
    useElementSettings();

const format = enumField('format', StringFormat.Text);
const formatOptions = Object.values(StringFormat);
const placeholder = optionalString('placeholder');
const minLength = optionalNumber('minLength');
const maxLength = optionalNumber('maxLength');
const pattern = optionalString('pattern');

/** multi: boolean | number — true renders a textarea. */
const multi = computed({
    get: () => {
        const el = element.value;
        const v = (el?.data as Record<string, unknown> | undefined)?.['multi'];
        return v === true || typeof v === 'number';
    },
    set: (v: boolean) => setField('multi', v ? true : undefined),
});
</script>

<template>
    <!-- inherited options (SimpleElement → BaseDataElement) -->
    <SimpleElementSettings />

    <!-- String-specific -->
    <SettingsSection title="String" icon="bi bi-pencil" :collapsible="true">
        <FieldSelect
            v-model="format"
            label="Format"
            :options="formatOptions"
            field-name="format"
        />
        <FieldCheck
            v-model="multi"
            label="Multiline (textarea)"
            field-name="multi"
        />
        <FieldText
            v-model="placeholder"
            label="Placeholder"
            field-name="placeholder"
        />
        <div class="row g-2">
            <div class="col">
                <FieldNumber
                    v-model="minLength"
                    label="Min length"
                    :min="0"
                    field-name="minLength"
                />
            </div>
            <div class="col">
                <FieldNumber
                    v-model="maxLength"
                    label="Max length"
                    :min="0"
                    field-name="maxLength"
                />
            </div>
        </div>
        <FieldText
            v-model="pattern"
            label="Pattern (regex)"
            field-name="pattern"
        />
    </SettingsSection>
</template>
