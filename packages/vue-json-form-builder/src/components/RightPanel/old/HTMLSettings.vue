<script setup lang="ts">
import { useFormStore } from '@/stores/formStore';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import FieldGroup from '@/components/shared/FieldGroup.vue';
import ShowOnEditor from '../ShowOnEditor.vue';
import type { HTMLElement_ } from '@/types/formTypes';

const props = defineProps<{
    element: HTMLElement_;
}>();

const store = useFormStore();

function update(updates: Partial<HTMLElement_>) {
    store.updateElement(props.element._id, updates as any);
}
</script>

<template>
    <div class="vstack gap-1">
        <SettingsSection title="HTML Content" icon="ph ph-code">
            <FieldGroup
                label="HTML"
                hint="⚠ HTML will be sanitized before rendering"
            >
                <textarea
                    :value="element.htmlData"
                    class="form-control form-control-sm font-mono text-xs"
                    rows="8"
                    placeholder="<p>Your HTML content here</p>"
                    @input="
                        update({
                            htmlData: ($event.target as HTMLTextAreaElement)
                                .value,
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
