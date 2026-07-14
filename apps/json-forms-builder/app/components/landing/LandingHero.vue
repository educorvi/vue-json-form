<script setup lang="ts">
defineProps<{
    authError: boolean;
}>();

const { t } = useI18n();
</script>

<template>
    <section
        class="d-flex flex-column align-items-center justify-content-center text-center px-4 py-5 bg-body"
    >
        <div class="mb-4">
            <span
                class="d-inline-flex align-items-center justify-content-center bg-light border rounded"
                style="width: 80px; height: 80px"
            >
                <PhosphorIcon
                    name="note-pencil"
                    :size="40"
                    class="text-primary"
                />
            </span>
        </div>

        <h1 class="display-3 fw-bold mb-3 text-primary">
            {{ t('landing.title') }}
        </h1>
        <p class="lead text-secondary mb-5" style="max-width: 36rem">
            {{ t('landing.subtitle') }}
        </p>

        <BAlert
            v-if="authError"
            variant="danger"
            :dismissible="false"
            class="mb-4 w-100"
            style="max-width: 28rem"
        >
            {{ t('landing.authError') }}
        </BAlert>

        <BButton href="/auth/keycloak" variant="primary" size="lg">
            <PhosphorIcon name="sign-in" class="me-2" />
            {{ t('landing.signInKeycloak') }}
        </BButton>
    </section>
</template>
