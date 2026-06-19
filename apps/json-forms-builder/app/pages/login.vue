<script setup lang="ts">
import { BCard, BButton } from 'bootstrap-vue-next';
import { definePageMeta, useUserSession, useRoute, navigateTo } from '#imports';
import { computed } from 'vue';

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
    <div>
        <div>
            <div>
                <h1>Form Builder</h1>
                <p>Sign in to continue</p>
            </div>

            <b-card class="shadow-sm">
                <div v-if="authError">
                    Authentication failed. Please try again.
                </div>

                <a href="/auth/keycloak" class="block">
                    <BButton> Sign in with Keycloak </BButton>
                </a>
            </b-card>
        </div>
    </div>
</template>
