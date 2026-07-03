<script setup lang="ts">
import { computed, ref } from 'vue';
import { BModal, BTabs, BTab } from 'bootstrap-vue-next';
import { useFormStore } from '@/stores/formStore';
import SchemaCodeBlock from './SchemaCodeBlock.vue';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ 'update:visible': [value: boolean] }>();

const store = useFormStore();

const visible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v),
});

const jsonSchemaString = computed(() =>
    JSON.stringify(store.exportedJsonSchema, null, 2)
);

const uiSchemaString = computed(() => JSON.stringify(store.uiSchema, null, 2));
</script>

<template>
    <BModal
        v-model="visible"
        title="Export Schemas"
        size="lg"
        :hide-footer="true"
    >
        <BTabs>
            <BTab title="JSON Schema">
                <div class="pt-3">
                    <SchemaCodeBlock
                        :code="jsonSchemaString"
                        label="JSON Schema"
                        filename="schema.json"
                    />
                </div>
            </BTab>
            <BTab title="UI Schema">
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
