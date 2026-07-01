<script setup lang="ts">
import { useFormStore } from '@/stores/formStore';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldGroup from '@/components/shared/FieldGroup.vue';
import type { ObjectElement } from '@/types/formTypes';

const props = defineProps<{ element: ObjectElement }>();
const store = useFormStore();
</script>

<template>
    <div class="vstack gap-1">
        <SettingsSection title="Object Identity" icon="bi bi-diagram-3">
            <FieldGroup label="Property Key" hint="Key in the JSON schema">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="element.key"
                    placeholder="objectKey"
                    @change="store.updateElement(element._id, { key: ($event.target as HTMLInputElement).value } as any)"
                />
            </FieldGroup>
            <FieldGroup label="Label">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="element.title ?? ''"
                    placeholder="Section label"
                    @input="store.updateElement(element._id, { title: ($event.target as HTMLInputElement).value || undefined } as any)"
                />
            </FieldGroup>
            <FieldGroup label="Description">
                <textarea
                    class="form-control form-control-sm"
                    :value="(element.description as string) ?? ''"
                    rows="2"
                    placeholder="Optional description..."
                    @input="store.updateElement(element._id, { description: ($event.target as HTMLTextAreaElement).value || undefined } as any)"
                />
            </FieldGroup>
        </SettingsSection>

        <div class="alert alert-warning py-2 px-3 text-xs">
            <i class="bi bi-info-circle me-1" />
            Drag field controls into this object to define its sub-properties.
        </div>

        <SettingsSection
            v-if="Object.keys((element.properties as Record<string, unknown>) ?? {}).length"
            title="Sub-properties"
            icon="bi bi-list-ul"
            collapsible
        >
            <div
                v-for="(prop, k) in element.properties as Record<string, { type?: unknown }>"
                :key="k"
                class="d-flex align-items-center justify-content-between py-1 border-bottom"
            >
                <span class="text-xs font-mono text-body">{{ k }}</span>
                <span class="badge bg-secondary bg-opacity-25 text-body text-xs">{{ prop.type }}</span>
            </div>
        </SettingsSection>
    </div>
</template>
