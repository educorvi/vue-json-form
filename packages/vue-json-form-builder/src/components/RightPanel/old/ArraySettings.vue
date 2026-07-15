<script setup lang="ts">
import { useFormStore } from '@/stores/formStore';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldGroup from '@/components/shared/FieldGroup.vue';
import type { ArrayElement } from '@/types/formTypes';

const props = defineProps<{ element: ArrayElement }>();
const store = useFormStore();
</script>

<template>
    <div class="vstack gap-1">
        <SettingsSection title="Array Identity" icon="ph ph-list">
            <FieldGroup label="Property Key" hint="Key in the JSON schema">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="element.key"
                    placeholder="arrayKey"
                    @change="
                        store.updateElement(element._id, {
                            key: ($event.target as HTMLInputElement).value,
                        } as any)
                    "
                />
            </FieldGroup>
            <FieldGroup label="Label">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="element.title ?? ''"
                    placeholder="Array label"
                    @input="
                        store.updateElement(element._id, {
                            title:
                                ($event.target as HTMLInputElement).value ||
                                undefined,
                        } as any)
                    "
                />
            </FieldGroup>
        </SettingsSection>

        <SettingsSection title="Constraints" icon="ph ph-sliders" collapsible>
            <FieldGroup label="Min Items">
                <input
                    type="number"
                    class="form-control form-control-sm"
                    :value="element.minItems ?? ''"
                    min="0"
                    placeholder="No minimum"
                    @input="
                        store.updateElement(element._id, {
                            minItems:
                                ($event.target as HTMLInputElement).value !== ''
                                    ? Number(
                                          ($event.target as HTMLInputElement)
                                              .value
                                      )
                                    : undefined,
                        } as any)
                    "
                />
            </FieldGroup>
            <FieldGroup label="Max Items">
                <input
                    type="number"
                    class="form-control form-control-sm"
                    :value="element.maxItems ?? ''"
                    min="0"
                    placeholder="No maximum"
                    @input="
                        store.updateElement(element._id, {
                            maxItems:
                                ($event.target as HTMLInputElement).value !== ''
                                    ? Number(
                                          ($event.target as HTMLInputElement)
                                              .value
                                      )
                                    : undefined,
                        } as any)
                    "
                />
            </FieldGroup>
        </SettingsSection>

        <div class="alert alert-danger py-2 px-3 text-xs">
            <i class="ph ph-info me-1" />
            Drag field controls into this array to define the item template.
        </div>

        <SettingsSection
            v-if="
                Object.keys(
                    (element.items as { properties?: Record<string, unknown> })
                        ?.properties ?? {}
                ).length
            "
            title="Item fields"
            icon="ph ph-list"
            collapsible
        >
            <div
                v-for="(prop, k) in (
                    element.items as {
                        properties?: Record<string, { type?: unknown }>;
                    }
                )?.properties"
                :key="k"
                class="d-flex align-items-center justify-content-between py-1 border-bottom"
            >
                <span class="text-xs font-mono text-body">{{ k }}</span>
                <span
                    class="badge bg-secondary bg-opacity-25 text-body text-xs"
                    >{{ prop.type }}</span
                >
            </div>
        </SettingsSection>
    </div>
</template>
