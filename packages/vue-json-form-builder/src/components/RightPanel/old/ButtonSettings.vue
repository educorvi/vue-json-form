<script setup lang="ts">
import { useFormStore } from '@/stores/formStore';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldGroup from '@/components/shared/FieldGroup.vue';
import ShowOnEditor from '../ShowOnEditor.vue';
import type { ButtonElement } from '@/types/formTypes';

const props = defineProps<{
    element: ButtonElement;
}>();

const store = useFormStore();

function update(updates: Partial<ButtonElement>) {
    store.updateElement(props.element._id, updates as any);
}

function updateOptions(updates: Partial<ButtonElement['options']>) {
    store.updateElement(props.element._id, {
        options: { ...props.element.options, ...updates },
    } as any);
}

const buttonTypeOptions = [
    { label: 'Submit', value: 'submit' },
    { label: 'Reset', value: 'reset' },
    { label: 'Next Wizard Page', value: 'nextWizardPage' },
    { label: 'Previous Wizard Page', value: 'previousWizardPage' },
];

const variantOptions = [
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Success', value: 'success' },
    { label: 'Danger', value: 'danger' },
    { label: 'Warning', value: 'warning' },
    { label: 'Info', value: 'info' },
];
</script>

<template>
    <div class="vstack gap-1">
        <SettingsSection title="Button Settings" icon="ph ph-paper-plane-right">
            <FieldGroup label="Button Text">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="element.text"
                    placeholder="Button Label"
                    @input="
                        update({
                            text: ($event.target as HTMLInputElement).value,
                        })
                    "
                />
            </FieldGroup>

            <FieldGroup label="Button Type">
                <select
                    class="form-select form-select-sm"
                    :value="element.buttonType"
                    @change="
                        update({
                            buttonType: ($event.target as HTMLSelectElement)
                                .value as any,
                        })
                    "
                >
                    <option
                        v-for="opt in buttonTypeOptions"
                        :key="opt.value"
                        :value="opt.value"
                    >
                        {{ opt.label }}
                    </option>
                </select>
            </FieldGroup>

            <FieldGroup label="Variant / Color">
                <select
                    class="form-select form-select-sm"
                    :value="element.options?.variant ?? ''"
                    @change="
                        updateOptions({
                            variant:
                                (($event.target as HTMLSelectElement)
                                    .value as any) || undefined,
                        })
                    "
                >
                    <option value="">Default</option>
                    <option
                        v-for="opt in variantOptions"
                        :key="opt.value"
                        :value="opt.value"
                    >
                        {{ opt.label }}
                    </option>
                </select>
            </FieldGroup>

            <FieldGroup label="CSS Class">
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="element.options?.cssClass ?? ''"
                    placeholder="e.g. btn-lg"
                    @input="
                        updateOptions({
                            cssClass: ($event.target as HTMLInputElement).value,
                        })
                    "
                />
            </FieldGroup>

            <div class="d-flex align-items-center justify-content-between py-1">
                <label class="text-xs fw-medium text-body">Disabled</label>
                <div class="form-check form-switch mb-0">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        :checked="element.options?.disabled ?? false"
                        @change="
                            updateOptions({
                                disabled: ($event.target as HTMLInputElement)
                                    .checked,
                            })
                        "
                    />
                </div>
            </div>

            <div class="d-flex align-items-center justify-content-between py-1">
                <label class="text-xs fw-medium text-body"
                    >No Validate on Submit</label
                >
                <div class="form-check form-switch mb-0">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        :checked="element.options?.formnovalidate ?? false"
                        @change="
                            updateOptions({
                                formnovalidate: (
                                    $event.target as HTMLInputElement
                                ).checked,
                            })
                        "
                    />
                </div>
            </div>
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
