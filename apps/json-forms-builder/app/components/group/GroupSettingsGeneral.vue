<!--
    GroupSettingsGeneral – General section for the group edit page.
-->
<script setup lang="ts">
defineProps<{
    modelValue: string;
    description: string;
    groupId: number;
    groupPath: string;
    groupName: string;
    saving?: boolean;
    savedMsg?: boolean;
    saveError?: string | null;
    hasChanges?: boolean;
    titleState?: boolean | undefined;
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
                :disabled="!hasChanges || saving"
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
                        {{ groupId }}
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
                        /{{ groupPath }}
                    </div>
                </BFormGroup>
            </BCol>
            <BCol cols="4">
                <BFormGroup
                    :label="$t('groups.edit.fields.name')"
                    label-class="fw-medium text-secondary small"
                >
                    <div
                        class="form-control font-monospace opacity-50 small py-1"
                        disabled
                    >
                        {{ groupName }}
                    </div>
                </BFormGroup>
            </BCol>
        </BRow>

        <BFormGroup
            :label="$t('groups.edit.fields.title')"
            label-class="fw-medium"
        >
            <BFormInput
                :model-value="modelValue"
                :placeholder="$t('groups.edit.fields.titlePlaceholder')"
                :state="titleState"
                @update:model-value="emit('update:modelValue', $event)"
            />
            <BFormInvalidFeedback :force-show="titleState === false">
                {{ $t('common.required') }}
            </BFormInvalidFeedback>
        </BFormGroup>

        <BFormGroup
            :label="$t('groups.edit.fields.description')"
            label-class="fw-medium"
            class="mb-0"
        >
            <BFormTextarea
                :model-value="description"
                :placeholder="$t('groups.edit.fields.descriptionPlaceholder')"
                rows="2"
                @update:model-value="emit('update:description', $event)"
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
