<script setup lang="ts">
const { loggedIn } = useUserSession();
const route = useRoute();

// Already logged in at the external Keycloak — straight to the dashboard.
if (loggedIn.value) {
    await navigateTo('/dashboard');
}

const authError = computed(() => route.query.error === 'auth_failed');
</script>

<template>
    <div
        class="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4"
    >
        <div class="text-center" style="max-width: 30rem">
            <h1 class="h3 fw-bold mb-2">Example External Application</h1>
            <p class="text-secondary mb-4">
                This minimal app logs in against the external Keycloak
                (external-keycloak.localhost) and then embeds the form-builder
                webcomponent, which authenticates against the main app's
                Keycloak (kc1) via <code>kc_idp_hint</code> — no second login
                needed.
            </p>

            <BAlert
                v-if="authError"
                show
                variant="danger"
                :dismissible="false"
                class="mb-3"
            >
                Authentication failed. Please try again.
            </BAlert>

            <a href="/auth/keycloak" class="d-block">
                <BButton variant="primary" class="w-100">
                    <i class="bi bi-box-arrow-in-right me-2"></i>
                    Login
                </BButton>
            </a>
        </div>
    </div>
</template>
