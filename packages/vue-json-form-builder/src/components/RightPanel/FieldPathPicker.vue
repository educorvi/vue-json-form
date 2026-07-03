<script setup lang="ts">
import { computed } from 'vue';
import { useFormStore } from '@/stores/formStore';
import type { ControlFieldNode } from '@/types/elements/controlFields';

const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

const store = useFormStore();

function flattenNodes(
    nodes: ControlFieldNode[],
    prefix = ''
): { value: string; text: string }[] {
    return nodes.flatMap((n) => {
        const label = prefix ? `${prefix} > ${n.title}` : n.title;
        return [
            { value: n.path, text: label },
            ...flattenNodes(n.children ?? [], label),
        ];
    });
}

const flatOptions = computed(() => flattenNodes(store.controlFields));
const hasOptions = computed(() => flatOptions.value.length > 0);
</script>

<template>
    <div>
        <select
            class="form-select form-select-sm"
            :value="modelValue"
            :disabled="!hasOptions"
            @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        >
            <option value="">{{ hasOptions ? 'Pick a field…' : 'No fields in form yet' }}</option>
            <option
                v-for="opt in flatOptions"
                :key="opt.value"
                :value="opt.value"
            >{{ opt.text }}</option>
        </select>
        <p
            v-if="modelValue && !hasOptions"
            class="text-xs text-body font-mono px-1 mt-1 mb-0"
        >{{ modelValue }}</p>
    </div>
</template>
