<script setup lang="ts">
import UserAvatarStack from '@/components/shared/presence/UserAvatarStack.vue';
import { useFieldEditingPresence } from '@/composables/useFieldEditingPresence';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
    defineProps<{
        label: string;
        min?: number;
        step?: number;
        fieldName?: string;
    }>(),
    { step: 1, fieldName: undefined }
);
/** bound as string — '' means "not set" (optional number fields) */
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
        <input
            v-bind="$attrs"
            v-model="model"
            type="number"
            class="form-control form-control-sm"
            :min="min"
            :step="step"
            @focus="onFocus"
            @blur="onBlur"
        />
    </div>
</template>
