<script setup lang="ts">
import { computed } from 'vue';
import { BFormTextarea } from 'bootstrap-vue-next';
import { validateJsonText } from './useImportState';

const props = defineProps<{
    modelValue: string;
    label: string;
    placeholder: string;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const error = computed(() => validateJsonText(props.modelValue));
</script>

<template>
    <div class="d-flex flex-column gap-1">
        <label class="form-label fw-medium small">{{ label }}</label>
        <BFormTextarea
            :model-value="modelValue"
            :placeholder="placeholder"
            :rows="18"
            class="font-mono text-xs"
            :state="error ? false : null"
            spellcheck="false"
            autocomplete="off"
            @update:model-value="emit('update:modelValue', $event as string)"
        />
        <div v-if="error" class="text-danger text-xs">{{ error }}</div>
    </div>
</template>
