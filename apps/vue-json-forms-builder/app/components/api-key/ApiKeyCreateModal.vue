<!--
    ApiKeyCreateModal – Create a new API key.

    On success the plain-text token is shown exactly once (with a copy
    button) before the modal can be closed — the token can never be
    retrieved again afterwards.
-->
<script setup lang="ts">
import type { z } from 'zod';
import type { zApiKeyCreated } from '~~/server/orpc/generated/zod.gen';

type CreatedApiKey = z.infer<typeof zApiKeyCreated>;

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    created: [key: CreatedApiKey];
}>();

const { t } = useI18n();
const { notify } = useNotify();
const { copyToClipboard } = useClipboard();
const orpc = useNuxtApp().$orpc;

// ── Form state ─────────────────────────────────────────────────────────────
const name = ref('');
const description = ref('');
const expiresAt = ref('');
const submitting = ref(false);
const errorMessage = ref<string | null>(null);

/** Set once the key was created — swaps the form for the one-time token view. */
const createdKey = ref<CreatedApiKey | null>(null);

const canSubmit = computed(
    () => name.value.trim().length > 0 && !submitting.value && !createdKey.value
);

function reset() {
    name.value = '';
    description.value = '';
    expiresAt.value = '';
    submitting.value = false;
    errorMessage.value = null;
    createdKey.value = null;
}

watch(
    () => props.modelValue,
    (open) => {
        if (open) reset();
    }
);

async function submit() {
    if (!canSubmit.value) return;
    submitting.value = true;
    errorMessage.value = null;
    try {
        const key = await orpc.apiKeys.create({
            body: {
                name: name.value.trim(),
                description: description.value.trim() || null,
                expires_at: expiresAt.value || undefined,
            },
        });
        createdKey.value = key;
        emit('created', key);
        notify(t('apiKeys.new.createSuccess'), 'success');
    } catch (err: any) {
        const msg =
            err?.message ?? err?.data?.message ?? t('apiKeys.new.createError');
        errorMessage.value = msg;
        notify(msg, 'danger');
    } finally {
        submitting.value = false;
    }
}

function close() {
    emit('update:modelValue', false);
}

async function copyToken() {
    if (!createdKey.value) return;
    await copyToClipboard(createdKey.value.token, t('apiKeys.new.tokenCopied'));
}
</script>

<template>
    <BModal
        :model-value="modelValue"
        :title="
            createdKey ? t('apiKeys.new.tokenTitle') : t('apiKeys.new.title')
        "
        :no-close-on-backdrop="!!createdKey || submitting"
        :no-close-on-esc="!!createdKey || submitting"
        @update:model-value="emit('update:modelValue', $event)"
        @hide="reset"
    >
        <!-- One-time token view -->
        <div v-if="createdKey">
            <BAlert
                show
                variant="warning"
                :dismissible="false"
                class="d-flex align-items-center gap-2"
            >
                <Icon name="ph:warning" :size="20" />
                <span>{{ t('apiKeys.new.tokenWarning') }}</span>
            </BAlert>

            <BFormGroup
                :label="t('apiKeys.new.tokenTitle')"
                label-class="fw-medium"
            >
                <BInputGroup>
                    <BFormInput
                        :model-value="createdKey.token"
                        readonly
                        class="font-monospace"
                        data-testid="api-key-token-input"
                    />
                    <BButton
                        variant="outline-primary"
                        :title="t('apiKeys.new.tokenCopy')"
                        data-testid="copy-token-button"
                        @click="copyToken"
                    >
                        <Icon name="ph:clipboard" />
                        {{ t('apiKeys.new.tokenCopy') }}
                    </BButton>
                </BInputGroup>
            </BFormGroup>
        </div>

        <!-- Create form -->
        <div v-else>
            <BFormGroup
                :label="t('apiKeys.new.fields.name')"
                label-class="fw-medium"
                required
            >
                <BFormInput
                    v-model="name"
                    :placeholder="t('apiKeys.new.fields.namePlaceholder')"
                    autofocus
                    data-testid="api-key-name-input"
                />
            </BFormGroup>

            <BFormGroup
                :label="t('apiKeys.new.fields.description')"
                label-class="fw-medium"
            >
                <BFormInput
                    v-model="description"
                    :placeholder="
                        t('apiKeys.new.fields.descriptionPlaceholder')
                    "
                    data-testid="api-key-description-input"
                />
            </BFormGroup>

            <BFormGroup
                :label="t('apiKeys.new.fields.expires')"
                label-class="fw-medium"
            >
                <BFormInput
                    v-model="expiresAt"
                    type="date"
                    data-testid="api-key-expires-input"
                />
                <BFormText>
                    {{ t('apiKeys.new.fields.expiresHint') }}
                </BFormText>
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
        </div>

        <template #footer>
            <template v-if="!createdKey">
                <BButton variant="secondary" @click="close">
                    {{ t('common.cancel') }}
                </BButton>
                <BButton
                    variant="primary"
                    :disabled="!canSubmit"
                    :pending="submitting"
                    data-testid="api-key-create-submit"
                    @click="submit"
                >
                    {{ t('apiKeys.new.create') }}
                </BButton>
            </template>
            <BButton
                v-else
                variant="primary"
                data-testid="api-key-create-close"
                @click="close"
            >
                {{ t('common.close') }}
            </BButton>
        </template>
    </BModal>
</template>
