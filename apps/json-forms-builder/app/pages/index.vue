<script setup lang="ts">
import { markRaw } from 'vue';
import type { Component } from 'vue';
import {
    PhNotePencil,
    PhUsers,
    PhShieldCheck,
    PhCode,
    PhClockCounterClockwise,
    PhLock,
    PhSignIn,
} from '@phosphor-icons/vue';

definePageMeta({ layout: false });

const { t } = useI18n();
const { loggedIn } = useUserSession();

if (loggedIn.value) {
    await navigateTo('/dashboard');
}

const orpc = useNuxtApp().$orpc;
const { data: apiStatus, error: apiStatusError } = await useAsyncData(
    'api-status',
    () => orpc.status.get()
);

const route = useRoute();
const authError = computed(() => route.query.error === 'auth_failed');

interface Feature {
    icon: Component;
    titleKey: string;
    descKey: string;
}

const featureDefs: Feature[] = [
    {
        icon: markRaw(PhNotePencil),
        titleKey: 'features.formBuilder.title',
        descKey: 'features.formBuilder.description',
    },
    {
        icon: markRaw(PhUsers),
        titleKey: 'features.userManagement.title',
        descKey: 'features.userManagement.description',
    },
    {
        icon: markRaw(PhShieldCheck),
        titleKey: 'features.permissions.title',
        descKey: 'features.permissions.description',
    },
    {
        icon: markRaw(PhCode),
        titleKey: 'features.openApi.title',
        descKey: 'features.openApi.description',
    },
    {
        icon: markRaw(PhClockCounterClockwise),
        titleKey: 'features.versioning.title',
        descKey: 'features.versioning.description',
    },
    {
        icon: markRaw(PhLock),
        titleKey: 'features.sso.title',
        descKey: 'features.sso.description',
    },
];

const features = computed(() =>
    featureDefs.map((f) => ({
        icon: f.icon,
        title: t(f.titleKey),
        description: t(f.descKey),
    }))
);
</script>

<template>
    <div class="min-vh-100 d-flex flex-column bg-body-tertiary">
        <!-- Top bar -->
        <BNavbar variant="light" class="border-bottom bg-body px-3 py-2">
            <div class="d-flex w-100 align-items-center">
                <BNavbarBrand
                    href="/"
                    class="d-flex align-items-center gap-2 mb-0"
                >
                    <PhNotePencil :size="20" class="text-primary" />
                    <span class="fw-semibold small">Form Builder</span>
                </BNavbarBrand>
                <div class="d-flex align-items-center gap-2 ms-auto">
                    <LocaleSwitcher />
                    <ThemeSwitcher />
                </div>
            </div>
        </BNavbar>

        <!-- Hero -->
        <section
            class="d-flex flex-column align-items-center justify-content-center text-center px-4 py-5 bg-body"
        >
            <div class="mb-4">
                <span
                    class="d-inline-flex align-items-center justify-content-center bg-light border rounded"
                    style="width: 80px; height: 80px"
                >
                    <PhNotePencil :size="40" class="text-primary" />
                </span>
            </div>

            <h1 class="display-3 fw-bold mb-3">
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
                <PhSignIn :size="20" class="me-2" />
                {{ t('landing.signInKeycloak') }}
            </BButton>
        </section>

        <!-- Features -->
        <section class="px-4 py-5 bg-body-tertiary">
            <div class="container">
                <div class="text-center mb-5">
                    <h2 class="display-5 fw-bold mb-2">
                        {{ t('landing.featuresHeading') }}
                    </h2>
                    <p class="text-secondary fs-5">
                        {{ t('landing.featuresSubheading') }}
                    </p>
                </div>
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    <div
                        v-for="feature in features"
                        :key="feature.title"
                        class="col"
                    >
                        <FeatureCard
                            :icon="feature.icon"
                            :title="feature.title"
                            :description="feature.description"
                        />
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-body border-top px-4 py-4 text-center">
            <span class="text-secondary small">
                {{ t('landing.footer') }}
            </span>
            <div class="mt-2 small font-monospace" data-testid="api-status">
                <template v-if="apiStatusError">
                    <span class="text-danger"
                        >API error: {{ apiStatusError.message }}</span
                    >
                </template>
                <template v-else-if="apiStatus">
                    <span class="text-success">v{{ apiStatus.version }}</span>
                </template>
            </div>
        </footer>
    </div>
</template>
