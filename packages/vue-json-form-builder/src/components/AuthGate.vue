<script setup lang="ts">
import { BAlert, BButton, BSpinner } from 'bootstrap-vue-next';
import type { BuilderAuthMode } from '@/composables/useBuilderAuth';

/**
 * Authentication gate shown while the builder checks the auth state
 * (session check / silent check-sso) or when the user must log in.
 *
 * Rendered INSTEAD of the builder when auth is configured (keycloak or
 * backendUrl) and not yet confirmed. Three states:
 *
 *   1. checkingAuth          — spinner while checking the session /
 *                              silent check-sso
 *   2. loginRequired         — no session; show a "Sign in" button (its
 *                              click starts the login: in keycloak mode a
 *                              top-level redirect to Keycloak, in session
 *                              mode a redirect to the backend's login)
 *   3. authError             — auth service unreachable or init failed;
 *                              show the error + "Try again"
 */
defineProps<{
    /** true while the session check / silent check-sso runs */
    checkingAuth: boolean;
    /** true when no session exists — show a "Sign in" button */
    loginRequired?: boolean;
    /** error message (service unreachable, init failed, …) */
    authError?: string | null;
    /** 'keycloak' (Keycloak login) or 'session' (backend login) — copy only */
    mode?: BuilderAuthMode;
}>();

const emit = defineEmits<{
    /** User clicked "Sign in". */
    signIn: [];
    /** User clicked "Try again" after an error. */
    retry: [];
}>();
</script>

<template>
    <div
        class="vjfb-auth d-flex align-items-center justify-content-center"
        style="min-height: 300px"
    >
        <div v-if="checkingAuth" class="text-center text-secondary">
            <BSpinner class="mb-2" />
            <div class="small">Checking authentication…</div>
        </div>
        <div
            v-else-if="loginRequired"
            class="text-center"
            style="max-width: 30rem"
        >
            <BAlert show variant="info">
                To load this form, sign in to the form-builder
                {{ mode === 'session' ? 'backend' : 'Keycloak' }}.
            </BAlert>
            <BButton size="sm" variant="primary" @click="emit('signIn')">
                Sign in
            </BButton>
        </div>
        <div v-else-if="authError" class="text-center" style="max-width: 30rem">
            <BAlert show variant="danger">
                {{ authError }}
            </BAlert>
            <BButton size="sm" variant="primary" @click="emit('retry')">
                Try again
            </BButton>
        </div>
    </div>
</template>
