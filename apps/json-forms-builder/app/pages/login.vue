<script setup lang="ts">
definePageMeta({ layout: false });

const { loggedIn } = useUserSession();
const route = useRoute();

// Redirect already-logged-in users to dashboard
if (loggedIn.value) {
    await navigateTo('/dashboard');
}

const authError = computed(() => route.query.error === 'auth_failed');
</script>

<template>
    <div
        class="min-h-screen bg-surface-50 dark:bg-surface-900 flex items-center justify-center p-6"
    >
        <div class="w-full max-w-sm">
            <div class="text-center mb-8">
                <h1
                    class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2"
                >
                    Form Builder
                </h1>
                <p class="text-surface-400">Sign in to continue</p>
            </div>

            <Card class="shadow-sm">
                <template #content>
                    <Message
                        v-if="authError"
                        severity="error"
                        class="mb-4"
                        :closable="false"
                    >
                        Authentication failed. Please try again.
                    </Message>

                    <a href="/auth/keycloak" class="block">
                        <Button
                            label="Sign in with Keycloak"
                            icon="pi pi-sign-in"
                            class="w-full"
                        />
                    </a>
                </template>
            </Card>
        </div>
    </div>
</template>
