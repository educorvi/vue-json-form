<script setup lang="ts">
import { useFormStore } from '@/stores/formStore';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldGroup from '@/components/shared/FieldGroup.vue';
import ShowOnEditor from '../ShowOnEditor.vue';
import type { LayoutElement } from '@/types/formTypes';

const props = defineProps<{
    element: LayoutElement;
}>();

const store = useFormStore();

function updateOptions(updates: Partial<LayoutElement['options']>) {
    store.updateElement(props.element._id, {
        options: { ...props.element.options, ...updates },
    } as Partial<LayoutElement>);
}

const layoutTypeOptions = [
    { label: 'Vertical Layout', value: 'VerticalLayout' },
    { label: 'Horizontal Layout', value: 'HorizontalLayout' },
    { label: 'Group', value: 'Group' },
];
</script>

<template>
    <div class="vstack gap-1">
        <SettingsSection title="Layout Settings" icon="ph ph-layout">
            <FieldGroup label="Layout Type">
                <select
                    class="form-select form-select-sm"
                    :value="element.type"
                    @change="
                        store.updateElement(element._id, {
                            type: ($event.target as HTMLSelectElement)
                                .value as any,
                        } as Partial<LayoutElement>)
                    "
                >
                    <option
                        v-for="opt in layoutTypeOptions"
                        :key="opt.value"
                        :value="opt.value"
                    >
                        {{ opt.label }}
                    </option>
                </select>
            </FieldGroup>

            <template v-if="element.type === 'Group'">
                <FieldGroup label="Group Label">
                    <input
                        type="text"
                        class="form-control form-control-sm"
                        :value="element.options?.label ?? ''"
                        placeholder="Group title"
                        @input="
                            updateOptions({
                                label: ($event.target as HTMLInputElement)
                                    .value,
                            })
                        "
                    />
                </FieldGroup>
                <FieldGroup label="Group Description">
                    <textarea
                        class="form-control form-control-sm"
                        :value="element.options?.description ?? ''"
                        rows="2"
                        placeholder="Group description..."
                        @input="
                            updateOptions({
                                description: (
                                    $event.target as HTMLTextAreaElement
                                ).value,
                            })
                        "
                    />
                </FieldGroup>
            </template>

            <FieldGroup label="CSS Class">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="element.options?.cssClass ?? ''"
                    placeholder="e.g. my-layout"
                    @input="
                        updateOptions({
                            cssClass: ($event.target as HTMLInputElement).value,
                        })
                    "
                />
            </FieldGroup>
        </SettingsSection>

        <SettingsSection
            title="Visibility Rule (ShowOn)"
            icon="ph ph-eye-slash"
            collapsible
        >
            <ShowOnEditor :element-id="element._id" :show-on="element.showOn" />
        </SettingsSection>
    </div>
</template>
