<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '@/stores/formStore';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldGroup from '@/components/shared/FieldGroup.vue';

const store = useFormStore();

const rootType = computed({
    get: () => store.rootLayout.type,
    set: (v: any) => {
        store.rootLayout.type = v;
    },
});

const layoutTypeOptions = [
    { label: 'Vertical Layout', value: 'VerticalLayout' },
    { label: 'Horizontal Layout', value: 'HorizontalLayout' },
    { label: 'Group', value: 'Group' },
];
</script>

<template>
    <div>
        <div
            class="mb-4 p-3 bg-primary-50 dark:bg-primary-950/30 rounded-lg border border-primary-100 dark:border-primary-900"
        >
            <p class="text-xs text-primary-700 dark:text-primary-400">
                <i class="ph ph-info me-1" />
                Select an element on the canvas to edit its settings.
            </p>
        </div>

        <SettingsSection title="Form Metadata" icon="ph ph-file-edit">
            <FieldGroup label="Form Title">
                <InputText
                    :model-value="store.jsonSchema.title"
                    @update:model-value="
                        store.jsonSchema.title = $event as string
                    "
                    class="w-full"
                    size="small"
                    placeholder="My Form"
                />
            </FieldGroup>

            <FieldGroup label="Form Description">
                <Textarea
                    :model-value="store.jsonSchema.description"
                    @update:model-value="
                        store.jsonSchema.description = $event as string
                    "
                    class="w-full"
                    rows="2"
                    placeholder="Describe your form..."
                    size="small"
                />
            </FieldGroup>
        </SettingsSection>

        <SettingsSection title="Root Layout" icon="ph ph-layout">
            <FieldGroup label="Layout Type">
                <Select
                    v-model="rootType"
                    :options="layoutTypeOptions"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                    size="small"
                />
            </FieldGroup>

            <FieldGroup
                label="CSS Class"
                hint="Additional CSS classes for the root layout"
            >
                <InputText
                    :model-value="
                        store.rootLayout.type !== 'Wizard'
                            ? (store.rootLayout.options as any)?.cssClass
                            : undefined
                    "
                    @update:model-value="
                        if (store.rootLayout.type !== 'Wizard') {
                            store.rootLayout.options = {
                                ...store.rootLayout.options,
                                cssClass: $event as string,
                            };
                        }
                    "
                    class="w-full"
                    size="small"
                    placeholder="e.g. my-form-layout"
                />
            </FieldGroup>
        </SettingsSection>

        <SettingsSection title="Danger Zone" icon="ph ph-warning" collapsible>
            <Button
                icon="ph ph-trash"
                label="Clear all elements"
                severity="danger"
                outlined
                size="small"
                class="w-full"
                @click="store.clearForm()"
            />
        </SettingsSection>
    </div>
</template>
