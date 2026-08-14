<script setup lang="ts">
import { BAlert, BButton, BSpinner } from 'bootstrap-vue-next';

/**
 * Authentication gate shown while the builder checks the backend session
 * (or while the user logs in via the popup / inline "Sign in" button).
 *
 * Rendered INSTEAD of the builder when a backend is configured and the
 * session is not yet confirmed. Three states:
 *
 *   1. checkingAuth          — spinner while checking the session or while
 *                              the login popup is open
 *   2. loginRequired         — the popup was blocked; show a "Sign in"
 *                              button (its click runs startLoginFlow within
 *                              the user gesture, which is never blocked)
 *   3. authError             — the backend was unreachable or the login
 *                              timed out; show the error + "Try again"
 */
const props = defineProps<{
    /** true while the session check runs or the login popup is open */
    checkingAuth: boolean;
    /** true while the login popup window is open (spinner copy) */
    authPopupOpen?: boolean;
    /** true when the popup was blocked — show a "Sign in" button */
    loginRequired?: boolean;
    /** error message (backend unreachable, timeout, closed popup, …) */
    authError?: string | null;
}>();

const emit = defineEmits<{
    /** User clicked "Sign in" (popup was blocked before). */
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
            <div class="small">
                {{
                    authPopupOpen
                        ? 'Complete the login in the popup window…'
                        : 'Checking authentication…'
                }}
            </div>
        </div>
        <div
            v-else-if="loginRequired"
            class="text-center"
            style="max-width: 30rem"
        >
            <BAlert show variant="info">
                To load this form, sign in to the form-builder backend.
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
