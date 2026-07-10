<script setup lang="ts">
definePageMeta({ layout: false });

const { loggedIn } = useUserSession();
const route = useRoute();

// Redirect already-logged-in users to dashboard
if (loggedIn.value) {
    await navigateTo(Routes.DASHBOARD);
}

const authError = computed(() => route.query.error === 'auth_failed');
</script>

<template>
    <div
        class="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4"
    >
        <div class="w-100" style="max-width: 24rem">
            <div class="text-center mb-4">
                <h1 class="h3 fw-bold mb-2">Form Builder</h1>
                <p class="text-secondary">Sign in to continue</p>
            </div>

            <BCard class="shadow-sm">
                <BCardBody>
                    <BAlert
                        v-if="authError"
                        variant="danger"
                        :dismissible="false"
                        class="mb-3"
                    >
                        Authentication failed. Please try again.
                    </BAlert>

                    <a href="/auth/keycloak" class="d-block">
                        <BButton variant="primary" class="w-100">
                            <i class="ph ph-sign-in me-2"></i>
                            Sign in with Keycloak
                        </BButton>
                    </a>
                </BCardBody>
            </BCard>
        </div>
    </div>
</template>
