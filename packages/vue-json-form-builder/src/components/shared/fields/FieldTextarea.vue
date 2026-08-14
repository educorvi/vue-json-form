<script setup lang="ts">
import UserAvatarStack from '@/components/shared/presence/UserAvatarStack.vue';
import { useFieldEditingPresence } from '@/composables/useFieldEditingPresence';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
    defineProps<{
        label: string;
        rows?: number;
        placeholder?: string;
        fieldName?: string;
    }>(),
    { rows: 2, fieldName: undefined }
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
        <textarea
            v-bind="$attrs"
            v-model="model"
            class="form-control form-control-sm"
            :rows="rows"
            :placeholder="placeholder"
            @focus="onFocus"
            @blur="onBlur"
        ></textarea>
    </div>
</template>
