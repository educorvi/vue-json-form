<script setup lang="ts">
import { computed } from 'vue';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldNumber from '@/components/shared/fields/FieldNumber.vue';
import FieldCheck from '@/components/shared/fields/FieldCheck.vue';
import {
    FileType,
    FileuploadElement,
} from '@educorvi/vue-json-forms-builder-schemas';
import { useElementSettings } from './useElementSettings';
import SimpleElementSettings from './SimpleElementSettings.vue';

const { element, setField, optionalNumber, booleanField } =
    useElementSettings();

const minItems = optionalNumber('minItems');
const maxItems = optionalNumber('maxItems');
const maxFileSizeInMB = optionalNumber('maxFileSizeInMB');
const multiUpload = booleanField('multiUpload');
const displayAsSingleUploadField = booleanField('displayAsSingleUploadField');

const acceptedFileType = computed<FileType[]>({
    get: () => {
        const el = element.value;
        return el instanceof FileuploadElement
            ? (el.data.acceptedFileType ?? [])
            : [];
    },
    set: (v: FileType[]) => setField('acceptedFileType', v),
});

function toggleFileType(t: FileType) {
    const current = acceptedFileType.value;
    acceptedFileType.value = current.includes(t)
        ? current.filter((x) => x !== t)
        : [...current, t];
}
</script>

<template>
    <!-- inherited options (SimpleElement → BaseDataElement) -->
    <SimpleElementSettings />

    <!-- File-upload-specific -->
    <SettingsSection
        title="File Upload"
        icon="bi bi-file-earmark-arrow-up"
        :collapsible="true"
    >
        <FieldCheck
            v-model="multiUpload"
            label="Multiple files"
            field-name="multiUpload"
        />
        <FieldCheck
            v-model="displayAsSingleUploadField"
            label="Display as single upload field"
            field-name="displayAsSingleUploadField"
        />
        <div class="row g-2">
            <div class="col">
                <FieldNumber
                    v-model="minItems"
                    label="Min files"
                    :min="0"
                    field-name="minItems"
                />
            </div>
            <div class="col">
                <FieldNumber
                    v-model="maxItems"
                    label="Max files"
                    :min="0"
                    field-name="maxItems"
                />
            </div>
        </div>
        <FieldNumber
            v-model="maxFileSizeInMB"
            label="Max file size (MB)"
            :min="0"
            field-name="maxFileSizeInMB"
        />
        <div>
            <label class="form-label small fw-medium d-block"
                >Allowed file types</label
            >
            <div
                class="d-flex flex-wrap gap-2"
                style="max-height: 8rem; overflow-y: auto"
            >
                <label
                    v-for="t in FileType"
                    :key="t"
                    class="form-check form-check-inline small"
                    style="min-width: 6rem"
                >
                    <input
                        type="checkbox"
                        class="form-check-input"
                        :checked="acceptedFileType.includes(t)"
                        @change="toggleFileType(t)"
                    />
                    <span class="form-check-label">{{ t }}</span>
                </label>
            </div>
        </div>
    </SettingsSection>
</template>
