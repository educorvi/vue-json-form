<script setup lang="ts">
import { computed } from 'vue';
import type { JSONSchema } from '@educorvi/vue-json-form-schemas';
import {
    buildSchemaTree,
    type SchemaTreeNode,
} from '@/types/elements/schemaTree';

const props = defineProps<{
    modelValue: string;
    schema: JSONSchema;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

function flattenTree(
    nodes: SchemaTreeNode[],
    prefix = ''
): { value: string; text: string }[] {
    return nodes.flatMap((n) => {
        const label = prefix ? `${prefix} > ${n.label}` : n.label;
        return [
            { value: n.path, text: label },
            ...flattenTree(n.children ?? [], label),
        ];
    });
}

const flatOptions = computed(() => {
    const tree = buildSchemaTree(props.schema);
    return flattenTree(tree);
});

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
            <option value="">{{ hasOptions ? 'Pick from schema…' : 'No schema properties' }}</option>
            <option
                v-for="opt in flatOptions"
                :key="opt.value"
                :value="opt.value"
            >{{ opt.text }}</option>
        </select>
    </div>
</template>
