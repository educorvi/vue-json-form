<script setup lang="ts">
import UserAvatarStack from '@/components/shared/presence/UserAvatarStack.vue';
import { useFieldEditingPresence } from '@/composables/useFieldEditingPresence';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
    defineProps<{
        label: string;
        options: readonly string[];
        fieldName?: string;
    }>(),
    { fieldName: undefined }
);
const model = defineModel<string>({ default: '' });

const { editors, onFocus, onBlur } = useFieldEditingPresence(props.fieldName);
</script>

<template>
    <div>
        <label
            class="form-label small fw-medium d-flex align-items-center gap-1"
        >
            {{ label }}
            <UserAvatarStack
                v-if="editors.length > 0"
                :users="editors"
                size="xs"
                :max="4"
            />
        </label>
        <select
            v-bind="$attrs"
            v-model="model"
            class="form-select form-select-sm"
            @focus="onFocus"
            @blur="onBlur"
        >
            <option v-for="opt in options" :key="opt" :value="opt">
                {{ opt }}
            </option>
        </select>
    </div>
</template>
