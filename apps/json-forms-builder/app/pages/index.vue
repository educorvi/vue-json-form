<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useUserSession, navigateTo } from '#imports';
import { BButton } from 'bootstrap-vue-next';

const { t } = useI18n();
const route = useRoute();
const { loggedIn } = useUserSession();

const authError = computed(() => route.query.error === 'auth_failed');
</script>

<template>
    <h1>
        {{ t('landing.title') }}
    </h1>
    <p>
        {{ t('landing.subtitle') }}
    </p>

    <div v-if="authError">
        {{ t('landing.authError') }}
    </div>

    <BButton v-if="!loggedIn" @click="() => navigateTo('/auth/keycloak')">{{
        t('nav.signIn')
    }}</BButton>
</template>

<style scoped></style>
