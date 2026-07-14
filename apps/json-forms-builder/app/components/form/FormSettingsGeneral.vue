<!--
    FormSettingsGeneral – General section for the form edit page.
-->
<script setup lang="ts">
defineProps<{
    modelValue: string;
    description: string;
    formId: number;
    formPath: string;
    formName: string;
    saving?: boolean;
    savedMsg?: boolean;
    saveError?: string | null;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
    'update:description': [value: string];
    save: [];
}>();
</script>

<template>
    <SettingsSection
        :title="$t('settings.general')"
        :description="$t('settings.generalDescription')"
    >
        <template #actions>
            <BButton
                variant="primary"
                size="sm"
                :disabled="saving"
                @click="emit('save')"
            >
                <BSpinner v-if="saving" small class="me-1" />
                {{ $t('settings.save') }}
            </BButton>
        </template>

        <!-- Read-only metadata row -->
        <BRow class="g-2 mb-3">
            <BCol cols="2">
                <BFormGroup
                    label="ID"
                    label-class="fw-medium text-secondary small"
                >
                    <div class="form-control opacity-50 small py-1" disabled>
                        {{ formId }}
                    </div>
                </BFormGroup>
            </BCol>
            <BCol>
                <BFormGroup
                    :label="$t('groups.edit.fields.path')"
                    label-class="fw-medium text-secondary small"
                >
                    <div
                        class="form-control font-monospace opacity-50 small py-1"
                        disabled
                    >
                        /{{ formPath }}
                    </div>
                </BFormGroup>
            </BCol>
            <BCol cols="4">
                <BFormGroup
                    :label="$t('forms.edit.fields.name')"
                    label-class="fw-medium text-secondary small"
                >
                    <div
                        class="form-control font-monospace opacity-50 small py-1"
                        disabled
                    >
                        {{ formName }}
                    </div>
                </BFormGroup>
            </BCol>
        </BRow>

        <BFormGroup
            :label="$t('forms.edit.fields.title')"
            label-class="fw-medium"
        >
            <BFormInput
                :model-value="modelValue"
                :placeholder="$t('forms.edit.fields.titlePlaceholder')"
                @update:model-value="
                    emit('update:modelValue', $event as string)
                "
            />
        </BFormGroup>

        <BFormGroup
            :label="$t('forms.edit.fields.description')"
            label-class="fw-medium"
            class="mb-0"
        >
            <BFormTextarea
                :model-value="description"
                :placeholder="$t('forms.edit.fields.descriptionPlaceholder')"
                rows="2"
                @update:model-value="
                    emit('update:description', $event as string)
                "
            />
        </BFormGroup>

        <BAlert
            v-if="savedMsg"
            variant="success"
            :dismissible="true"
            class="mb-0 mt-2"
        >
            {{ $t('settings.saved') }}
        </BAlert>
        <BAlert
            v-if="saveError"
            variant="danger"
            :dismissible="false"
            class="mb-0 mt-2"
        >
            {{ saveError }}
        </BAlert>
    </SettingsSection>
</template>
