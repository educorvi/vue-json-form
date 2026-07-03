<script setup lang="ts">
import FieldGroup from './FieldGroup.vue';

interface SchemaEntry {
    type?: string;
    title?: string;
    description?: string;
    enum?: string[];
    default?: any;
}

const props = defineProps<{
    schema: Record<string, SchemaEntry>;
    values: Record<string, any>;
}>();

const emit = defineEmits<{
    update: [key: string, value: any];
}>();

function val(key: string): any {
    if (key in props.values && props.values[key] !== undefined)
        return props.values[key];
    return props.schema[key]?.default;
}
</script>

<template>
    <div class="vstack gap-2">
        <template v-for="(prop, key) in schema" :key="key">
            <!-- Boolean (toggle switch) -->
            <div
                v-if="prop.type === 'boolean'"
                class="d-flex align-items-center justify-content-between py-1"
                :title="prop.description"
            >
                <label class="text-xs fw-medium text-body">
                    {{ prop.title ?? key }}
                </label>
                <div class="form-check form-switch mb-0">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        role="switch"
                        :checked="val(String(key)) ?? false"
                        @change="
                            emit('update', String(key), ($event.target as HTMLInputElement).checked)
                        "
                    />
                </div>
            </div>

            <!-- String with enum → select -->
            <FieldGroup
                v-else-if="prop.type === 'string' && prop.enum?.length"
                :label="prop.title ?? String(key)"
                :hint="prop.description"
            >
                <select
                    class="form-select form-select-sm"
                    :value="val(String(key)) ?? ''"
                    @change="
                        emit('update', String(key), ($event.target as HTMLSelectElement).value || undefined)
                    "
                >
                    <option value="">{{ prop.default ?? '— default —' }}</option>
                    <option
                        v-for="opt in prop.enum"
                        :key="opt"
                        :value="opt"
                    >{{ opt }}</option>
                </select>
            </FieldGroup>

            <!-- String without enum → text input -->
            <FieldGroup
                v-else-if="prop.type === 'string'"
                :label="prop.title ?? String(key)"
                :hint="prop.description"
            >
                <input
                    type="text"
                    class="form-control form-control-sm"
                    :value="val(String(key)) ?? ''"
                    :placeholder="prop.description?.slice(0, 50) ?? ''"
                    @input="
                        emit('update', String(key), ($event.target as HTMLInputElement).value || undefined)
                    "
                />
            </FieldGroup>

            <!-- Integer or Number → number input -->
            <FieldGroup
                v-else-if="prop.type === 'integer' || prop.type === 'number'"
                :label="prop.title ?? String(key)"
                :hint="prop.description"
            >
                <input
                    type="number"
                    class="form-control form-control-sm"
                    :value="val(String(key)) ?? ''"
                    @input="
                        emit('update', String(key), ($event.target as HTMLInputElement).value !== '' ? Number(($event.target as HTMLInputElement).value) : undefined)
                    "
                />
            </FieldGroup>
        </template>
    </div>
</template>
