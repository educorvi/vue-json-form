<script setup lang="ts">
definePageMeta({ layout: false });

const { loggedIn } = useUserSession();

if (loggedIn.value) {
    await navigateTo('/dashboard');
}

const route = useRoute();
const authError = computed(() => route.query.error === 'auth_failed');

interface Feature {
    icon: string;
    title: string;
    description: string;
}

const features: Feature[] = [
    {
        icon: 'pi pi-file-edit',
        title: 'Visual Form Builder',
        description:
            'Design complex JSON Schema-driven forms with a drag-and-drop interface and live preview.',
    },
    {
        icon: 'pi pi-users',
        title: 'User & Role Management',
        description:
            'Manage system users, assign roles, and control access to forms and data.',
    },
    {
        icon: 'pi pi-shield',
        title: 'Fine-grained Permissions',
        description:
            'Define granular access policies per form, schema, or resource for your organisation.',
    },
    {
        icon: 'pi pi-code',
        title: 'OpenAPI REST Interface',
        description:
            'Every resource is accessible via a fully documented, standards-compliant REST API.',
    },
    {
        icon: 'pi pi-history',
        title: 'Schema Versioning',
        description:
            'Track changes to your JSON Schemas over time and roll back to any previous version.',
    },
    {
        icon: 'pi pi-lock',
        title: 'Single Sign-On',
        description:
            'Authenticate via Keycloak OIDC — one login for all services in your infrastructure.',
    },
];
</script>

<template>
    <div class="min-h-screen flex flex-col surface-ground">
        <!-- Minimal top bar -->
        <Menubar class="rounded-none border-x-0 border-t-0">
            <template #start>
                <div class="flex items-center gap-2">
                    <i class="pi pi-file-edit text-primary text-lg" />
                    <span class="font-semibold text-sm">Form Builder</span>
                </div>
            </template>
            <template #end>
                <Button
                    as="a"
                    href="/auth/keycloak"
                    label="Sign in"
                    icon="pi pi-sign-in"
                    size="small"
                />
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
                Build &amp; Manage<br />
                <span class="text-primary">JSON Forms</span>
            </h1>
            <p
                class="text-xl text-color-secondary max-w-2xl mb-8 line-height-3"
            >
                A self-hosted form administration platform — design schemas,
                manage users, and expose a clean REST API, all in one place.
            </p>

            <Message
                v-if="authError"
                severity="error"
                class="mb-6 max-w-md w-full"
                :closable="false"
            >
                Authentication failed. Please try again.
            </Message>

            <Button
                as="a"
                href="/auth/keycloak"
                label="Sign in with Keycloak"
                icon="pi pi-sign-in"
                size="large"
            />
        </section>

        <!-- Features -->
        <section class="px-6 py-20 surface-card">
            <div class="max-w-6xl mx-auto">
                <div class="text-center mb-12">
                    <h2 class="text-4xl font-bold text-color mb-2">
                        Everything you need
                    </h2>
                    <p class="text-color-secondary text-lg">
                        One platform for forms, users, and APIs
                    </p>
                </div>
                <div
                    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                >
                    <Card
                        v-for="feature in features"
                        :key="feature.title"
                        class="shadow-1"
                    >
                        <template #header>
                            <div
                                class="flex items-center justify-center pt-5 pb-2"
                            >
                                <span
                                    class="inline-flex items-center justify-center w-14 h-14 rounded-full surface-ground"
                                >
                                    <i
                                        :class="[
                                            feature.icon,
                                            'text-primary text-2xl',
                                        ]"
                                    />
                                </span>
                            </div>
                        </template>
                        <template #title>{{ feature.title }}</template>
                        <template #content>
                            <p class="text-color-secondary line-height-3 m-0">
                                {{ feature.description }}
                            </p>
                        </template>
                    </Card>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer
            class="surface-section border-top-1 surface-border px-6 py-5 text-center"
        >
            <span class="text-color-secondary text-sm">
                Form Builder &mdash; built with Nuxt, oRPC &amp; PrimeVue
            </span>
        </footer>
    </div>
</template>
