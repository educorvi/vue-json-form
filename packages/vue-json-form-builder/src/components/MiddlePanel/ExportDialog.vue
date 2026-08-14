<script setup lang="ts">
import { computed, ref } from 'vue';
import { BModal, BTabs, BTab } from 'bootstrap-vue-next';
import { PhFileCode, PhFileText } from '@phosphor-icons/vue';
import { useFormBuilder } from '@/useFormBuilder';
import SchemaCodeBlock from './SchemaCodeBlock.vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ 'update:visible': [value: boolean] }>();

const builder = useFormBuilder();

const visible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v),
});

const activeTab = ref(0);

const schemas = computed(() => builder.generateSchemas());

const jsonSchemaString = computed(() =>
    JSON.stringify(schemas.value?.jsonSchema ?? {}, null, 2)
);

const uiSchemaString = computed(() =>
    JSON.stringify(schemas.value?.uiSchema ?? {}, null, 2)
);
</script>

<template>
    <BModal
        v-model="visible"
        title="Export Schemas"
        size="lg"
        :hide-footer="true"
    >
        <BTabs :index="activeTab" @update:index="activeTab = $event">
            <BTab title="JSON Schema">
                <template #title>
                    <PhFileCode :size="14" weight="bold" class="me-1" />
                    JSON Schema
                </template>
                <div class="pt-3">
                    <SchemaCodeBlock
                        :code="jsonSchemaString"
                        label="JSON Schema"
                        filename="schema.json"
                    />
                </div>
            </BTab>
            <BTab title="UI Schema">
                <template #title>
                    <PhFileText :size="14" weight="bold" class="me-1" />
                    UI Schema
                </template>
                <div class="pt-3">
                    <SchemaCodeBlock
                        :code="uiSchemaString"
                        label="UI Schema"
                        filename="ui-schema.json"
                    />
                </div>
            </BTab>
        </BTabs>
    </BModal>
</template>
