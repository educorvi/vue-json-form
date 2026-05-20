<script setup lang="ts">
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
    icon: string;
    titleKey: string;
    descKey: string;
}

const featureDefs: Feature[] = [
    {
        icon: 'pi pi-file-edit',
        titleKey: 'features.formBuilder.title',
        descKey: 'features.formBuilder.description',
    },
    {
        icon: 'pi pi-users',
        titleKey: 'features.userManagement.title',
        descKey: 'features.userManagement.description',
    },
    {
        icon: 'pi pi-shield',
        titleKey: 'features.permissions.title',
        descKey: 'features.permissions.description',
    },
    {
        icon: 'pi pi-code',
        titleKey: 'features.openApi.title',
        descKey: 'features.openApi.description',
    },
    {
        icon: 'pi pi-history',
        titleKey: 'features.versioning.title',
        descKey: 'features.versioning.description',
    },
    {
        icon: 'pi pi-lock',
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
    <div class="min-h-screen flex flex-col surface-ground">
        <!-- Top bar -->
        <Menubar class="rounded-none border-x-0 border-t-0 px-4 py-2">
            <template #start>
                <div class="flex items-center gap-2">
                    <i class="pi pi-file-edit text-primary text-xl" />
                    <span class="font-semibold text-sm">Form Builder</span>
                </div>
            </template>
            <template #end>
                <div class="flex items-center gap-2">
                    <LocaleSwitcher class="w-36" />
                    <ThemeSwitcher />
                    <DesignSystemSwitcher />
                    <!-- <Button
                        as="a"
                        href="/auth/keycloak"
                        :label="t('nav.signIn')"
                        icon="pi pi-sign-in"
                        size="small"
                    /> -->
                </div>
            </template>
        </Menubar>

        <!-- Hero -->
        <section
            class="flex flex-col items-center justify-center text-center px-6 py-24 surface-section"
        >
            <div class="mb-5">
                <span
                    class="inline-flex items-center justify-center w-20 h-20 rounded-full surface-card shadow-2"
                >
                    <i
                        class="pi pi-file-edit text-primary"
                        style="font-size: 2.5rem"
                    />
                </span>
            </div>

            <h1 class="text-6xl font-bold mb-4 text-color">
                {{ t('landing.title') }}
            </h1>
            <p
                class="text-xl text-color-secondary max-w-2xl mb-8 line-height-3"
            >
                {{ t('landing.subtitle') }}
            </p>

            <Message
                v-if="authError"
                severity="error"
                class="mb-6 max-w-md w-full"
                :closable="false"
            >
                {{ t('landing.authError') }}
            </Message>

            <Button
                as="a"
                href="/auth/keycloak"
                :label="t('landing.signInKeycloak')"
                icon="pi pi-sign-in"
                size="large"
            />
        </section>

        <!-- Features -->
        <section class="px-6 py-20 surface-card">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-bold text-color mb-2">
                        {{ t('landing.featuresHeading') }}
                    </h2>
                    <p class="text-color-secondary text-lg">
                        {{ t('landing.featuresSubheading') }}
                    </p>
                </div>
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    <FeatureCard
                        v-for="feature in features"
                        :key="feature.title"
                        :icon="feature.icon"
                        :title="feature.title"
                        :description="feature.description"
                    />
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer
            class="surface-section border-top-1 surface-border px-6 py-5 text-center"
        >
            <span class="text-color-secondary text-sm">
                {{ t('landing.footer') }}
            </span>
            <div class="mt-2 text-xs font-mono" data-testid="api-status">
                <template v-if="apiStatusError">
                    <span class="text-red-500"
                        >API error: {{ apiStatusError.message }}</span
                    >
                </template>
                <template v-else-if="apiStatus">
                    <span class="text-green-600"
                        >API {{ apiStatus.status }} v{{ apiStatus.version }} ({{
                            apiStatus.timestamp
                        }})</span
                    >
                </template>
            </div>
        </footer>
    </div>
</template>
