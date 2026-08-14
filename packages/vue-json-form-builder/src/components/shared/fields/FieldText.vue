<script setup lang="ts">
import UserAvatarStack from '@/components/shared/presence/UserAvatarStack.vue';
import { useFieldEditingPresence } from '@/composables/useFieldEditingPresence';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
    defineProps<{ label: string; placeholder?: string; fieldName?: string }>(),
    { fieldName: undefined }
);
const model = defineModel<string>({ default: '' });

// who is editing this field right now + announce my own editing
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
            type="text"
            class="form-control form-control-sm"
            :placeholder="placeholder"
            @focus="onFocus"
            @blur="onBlur"
        />
    </div>
</template>
