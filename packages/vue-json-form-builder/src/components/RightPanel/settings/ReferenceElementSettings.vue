<script setup lang="ts">
import { computed } from 'vue';
import SettingsSection from '@/components/shared/SettingsSection.vue';
import { BaseDataElement } from '@educorvi/vue-json-form-builder-schemas';
import { useElementSettings } from './useElementSettings';

const { builder, element, stringField } = useElementSettings();

const referenceId = stringField('referenceId');

const referenceOptions = computed(() => {
    const fd = builder.formDefinition.value;
    const el = element.value;
    if (!fd) return [];
    const candidates: { uid: string; label: string }[] = [];
    for (const other of fd.nodesIndex.values()) {
        if (el && other.uid === el.uid) continue;
        const label =
            other instanceof BaseDataElement
                ? other.data.title || other.id
                : other.id;
        candidates.push({ uid: other.uid, label });
    }
    return candidates;
});
</script>

<template>
    <SettingsSection title="Reference" icon="bi bi-link-45deg">
        <div>
            <label class="form-label small fw-medium">Referenced element</label>
            <select v-model="referenceId" class="form-select form-select-sm">
                <option value="">— none —</option>
                <option
                    v-for="c in referenceOptions"
                    :key="c.uid"
                    :value="c.uid"
                >
                    {{ c.label }}
                </option>
            </select>
        </div>
    </SettingsSection>
</template>
