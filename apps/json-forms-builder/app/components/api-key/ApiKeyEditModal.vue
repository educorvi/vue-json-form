<!--
    ApiKeyEditModal – Edit an existing API key (name + description).

    Changes are patched instantly on submit; the list is refreshed by the
    parent page via the `saved` event.
-->
<script setup lang="ts">
import type { z } from 'zod';
import type { zApiKey } from '~~/server/orpc/generated/zod.gen';
import type { RouterClient } from '@orpc/server';
import type { AppRouter } from '~~/server/orpc/routers';

type ApiKeyRow = z.infer<typeof zApiKey>;

const props = defineProps<{
    modelValue: boolean;
    apiKey: ApiKeyRow | null;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    saved: [key: ApiKeyRow];
}>();

const { t } = useI18n();
const { notify } = useNotify();
const orpc = useNuxtApp().$orpc as RouterClient<AppRouter>;

const name = ref('');
const description = ref('');
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

const canSubmit = computed(
    () => name.value.trim().length > 0 && !submitting.value
);

// Reset form when the modal opens for a key. The parent renders this
// component with v-if, so it can mount with modelValue already true —
// immediate ensures the prefill also runs in that case.
watch(
    () => props.modelValue,
    (open) => {
        if (open && props.apiKey) {
            name.value = props.apiKey.name;
            description.value = props.apiKey.description ?? '';
            submitting.value = false;
            errorMessage.value = null;
        }
    },
    { immediate: true }
);

async function submit() {
    if (!props.apiKey || !canSubmit.value) return;
    submitting.value = true;
    errorMessage.value = null;
    try {
        const updated = await orpc.apiKeys.patch({
            params: { id: props.apiKey.id },
            body: {
                name: name.value.trim(),
                description: description.value.trim() || null,
            },
        });
        emit('saved', updated);
        emit('update:modelValue', false);
        notify(t('apiKeys.edit.editSuccess'), 'success');
    } catch (err: any) {
        const msg =
            err?.message ?? err?.data?.message ?? t('apiKeys.edit.editError');
        errorMessage.value = msg;
        notify(msg, 'danger');
    } finally {
        submitting.value = false;
    }
}

function close() {
    emit('update:modelValue', false);
}
</script>

<template>
    <BModal
        :model-value="modelValue"
        :title="t('apiKeys.edit.title')"
        :no-close-on-backdrop="submitting"
        :no-close-on-esc="submitting"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <div v-if="apiKey" class="mb-3">
            <span class="font-monospace small text-secondary">
                {{ apiKey.identifier }}
            </span>
        </div>

        <BFormGroup
            :label="t('apiKeys.new.fields.name')"
            label-class="fw-medium"
            required
        >
            <BFormInput
                v-model="name"
                :placeholder="t('apiKeys.new.fields.namePlaceholder')"
                autofocus
                data-testid="api-key-edit-name-input"
            />
        </BFormGroup>

        <BFormGroup
            :label="t('apiKeys.new.fields.description')"
            label-class="fw-medium"
        >
            <BFormInput
                v-model="description"
                :placeholder="t('apiKeys.new.fields.descriptionPlaceholder')"
                data-testid="api-key-edit-description-input"
            />
        </BFormGroup>

        <BAlert
            v-if="errorMessage"
            show
            variant="danger"
            :dismissible="false"
            class="mb-0"
        >
            {{ errorMessage }}
        </BAlert>

        <template #footer>
            <BButton variant="secondary" @click="close">
                {{ t('common.cancel') }}
            </BButton>
            <BButton
                variant="primary"
                :disabled="!canSubmit"
                :pending="submitting"
                data-testid="api-key-edit-submit"
                @click="submit"
            >
                {{ t('settings.save') }}
            </BButton>
        </template>
    </BModal>
</template>
