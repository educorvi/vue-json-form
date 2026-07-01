<script setup lang="ts">
import { computed } from 'vue';
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
        <textarea
            :value="modelValue"
            :placeholder="placeholder"
            rows="18"
            class="form-control font-mono text-xs"
            :class="error ? 'is-invalid' : ''"
            spellcheck="false"
            autocomplete="off"
            @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        />
        <div v-if="error" class="invalid-feedback d-block">{{ error }}</div>
    </div>
</template>
