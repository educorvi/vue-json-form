<script setup lang="ts">
import { useId } from 'vue';
import UserAvatarStack from '@/components/shared/presence/UserAvatarStack.vue';
import { useFieldEditingPresence } from '@/composables/useFieldEditingPresence';

const props = withDefaults(
    defineProps<{ label: string; fieldName?: string }>(),
    { fieldName: undefined }
);
const model = defineModel<boolean>({ default: false });
const id = useId();

const { editors, onFocus, onBlur } = useFieldEditingPresence(props.fieldName);
</script>

<template>
    <div class="form-check d-flex align-items-center gap-1">
        <input
            :id="id"
            v-model="model"
            type="checkbox"
            class="form-check-input"
            @focus="onFocus"
            @blur="onBlur"
        />
        <label
            class="form-check-label small d-flex align-items-center gap-1"
            :for="id"
        >
            {{ label }}
            <UserAvatarStack
                v-if="editors.length > 0"
                :users="editors"
                size="xs"
                :max="4"
            />
        </label>
    </div>
</template>
